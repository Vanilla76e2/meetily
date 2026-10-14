//! Persistent user glossary for transcription hints and summary context.
//!
//! The same text is filled once and reused for every recording and summary.
//! Lines may be terms, short definitions, or `heard => preferred` replacements.

use std::sync::{LazyLock, Mutex};

use log::{info, warn};
use tauri::{AppHandle, Runtime};
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "user_glossary.json";
const STORE_KEY: &str = "glossary";
const MAX_CHARS: usize = 20_000;
const SUMMARY_CHARS: usize = 6_000;
const WHISPER_PROMPT_CHARS: usize = 300;

static GLOSSARY: LazyLock<Mutex<String>> = LazyLock::new(|| Mutex::new(String::new()));

struct ParsedGlossary {
    summary_text: String,
    whisper_terms: Vec<String>,
    replacements: Vec<(String, String)>,
}

fn lock_glossary() -> std::sync::MutexGuard<'static, String> {
    GLOSSARY.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

pub fn current_text() -> String {
    lock_glossary().clone()
}

fn set_current_text(text: &str) {
    *lock_glossary() = text.to_string();
}

pub fn load<R: Runtime>(app: &AppHandle<R>) {
    let store = match app.store(STORE_FILE) {
        Ok(store) => store,
        Err(error) => {
            warn!("Failed to open glossary store: {error}");
            return;
        }
    };

    let Some(value) = store.get(STORE_KEY) else {
        info!("No saved glossary found");
        return;
    };

    let Some(text) = value.as_str() else {
        warn!("Saved glossary is not a string, ignoring it");
        return;
    };

    set_current_text(text);
    info!("Loaded user glossary ({} chars)", text.chars().count());
}

pub fn save<R: Runtime>(app: &AppHandle<R>, glossary: &str) -> Result<(), String> {
    let char_count = glossary.chars().count();
    if char_count > MAX_CHARS {
        return Err(format!(
            "Glossary is too long ({char_count} characters, maximum {MAX_CHARS})"
        ));
    }

    let store = app
        .store(STORE_FILE)
        .map_err(|error| format!("Failed to open glossary store: {error}"))?;
    store.set(STORE_KEY, serde_json::Value::String(glossary.to_string()));
    store
        .save()
        .map_err(|error| format!("Failed to save glossary: {error}"))?;

    set_current_text(glossary);
    info!("Saved user glossary ({char_count} chars)");
    Ok(())
}

/// Empty when the glossary is blank, so existing summary caches stay valid.
pub fn cache_fingerprint() -> String {
    let text = current_text();
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    const FNV_OFFSET: u64 = 0xcbf29ce484222325;
    const FNV_PRIME: u64 = 0x100000001b3;
    let mut hash = FNV_OFFSET;
    for byte in trimmed.as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(FNV_PRIME);
    }
    format!("{:016x}:{}", hash, trimmed.len())
}

pub fn whisper_initial_prompt() -> Option<String> {
    whisper_initial_prompt_from(&current_text())
}

fn whisper_initial_prompt_from(text: &str) -> Option<String> {
    let parsed = parse_glossary(text);
    if parsed.whisper_terms.is_empty() {
        return None;
    }

    let mut prompt = String::new();
    for term in &parsed.whisper_terms {
        let separator = if prompt.is_empty() { "" } else { ", " };
        let next_len = prompt.chars().count() + separator.chars().count() + term.chars().count();
        if next_len > WHISPER_PROMPT_CHARS {
            break;
        }
        prompt.push_str(separator);
        prompt.push_str(term);
    }

    if prompt.is_empty() {
        None
    } else {
        Some(prompt.replace('\0', ""))
    }
}

pub fn append_to_prompt(prompt: &str) -> String {
    let block = summary_block();
    if block.is_empty() {
        prompt.to_string()
    } else {
        format!("{prompt}\n\n{block}")
    }
}

pub fn apply_to_transcript(text: &str) -> String {
    let parsed = parse_glossary(&current_text());
    apply_replacements(text, &parsed.replacements)
}

fn summary_block() -> String {
    let parsed = parse_glossary(&current_text());
    if parsed.summary_text.is_empty() {
        return String::new();
    }

        format!(
        "**USER GLOSSARY:**\nUse these spellings and meanings for slang, product names, and technical terms. Do not translate, rename, or \"correct\" the preferred forms. A line `heard => preferred` means `preferred` is the form to use. A `*` after a heard stem stands for any Russian word ending.\n<glossary>\n{}\n</glossary>",
        parsed.summary_text
    )
}

fn parse_glossary(text: &str) -> ParsedGlossary {
    let mut summary_lines = Vec::new();
    let mut whisper_terms = Vec::new();
    let mut replacements = Vec::new();
    let mut summary_chars = 0usize;

    for raw_line in text.lines() {
        let line = raw_line.trim();
        if line.is_empty() || line.starts_with('#') || line.starts_with("//") {
            continue;
        }

        let line_chars = line.chars().count();
        if summary_chars + line_chars + 1 <= SUMMARY_CHARS {
            summary_lines.push(line.to_string());
            summary_chars += line_chars + 1;
        }

        if let Some((alias, preferred)) = line.split_once("=>") {
            let alias = alias.trim();
            let preferred_full = preferred.trim();
            let preferred_term = canonical_term(preferred_full);
            if !alias.is_empty() && !preferred_term.is_empty() {
                replacements.push((alias.to_string(), preferred_term.clone()));
                push_unique_term(&mut whisper_terms, preferred_term);
            }
            continue;
        }

        let term = canonical_term(line);
        if !term.is_empty() && term.chars().count() <= 80 {
            push_unique_term(&mut whisper_terms, term);
        }
    }

    replacements.sort_by(|left, right| right.0.chars().count().cmp(&left.0.chars().count()));

    ParsedGlossary {
        summary_text: summary_lines.join("\n"),
        whisper_terms,
        replacements,
    }
}

fn canonical_term(value: &str) -> String {
    value
        .split(" (")
        .next()
        .unwrap_or(value)
        .split(" — ")
        .next()
        .unwrap_or(value)
        .split(" - ")
        .next()
        .unwrap_or(value)
        .split(": ")
        .next()
        .unwrap_or(value)
        .trim()
        .trim_matches(|ch: char| ch == '.' || ch == ',' || ch == ';')
        .to_string()
}

fn push_unique_term(terms: &mut Vec<String>, term: String) {
    let exists = terms
        .iter()
        .any(|existing| existing.eq_ignore_ascii_case(&term) || equal_ignore_case(existing, &term));
    if !exists {
        terms.push(term);
    }
}

fn apply_replacements(text: &str, replacements: &[(String, String)]) -> String {
    if text.is_empty() || replacements.is_empty() {
        return text.to_string();
    }

    let chars: Vec<char> = text.chars().collect();
    let mut matches: Vec<(usize, usize, &str)> = Vec::new();

    for (alias, preferred) in replacements {
        if let Some((stem, rest)) = stem_pattern(alias) {
            if stem.len() + rest.len() <= chars.len() {
                find_stem_matches(&chars, &stem, &rest, preferred, &mut matches);
            }
            continue;
        }

        let needle: Vec<char> = alias.chars().collect();
        if needle.is_empty() || needle.len() > chars.len() {
            continue;
        }

        let mut index = 0;
        while index + needle.len() <= chars.len() {
            if bounded_match(&chars, index, &needle) {
                matches.push((index, index + needle.len(), preferred.as_str()));
                index += needle.len();
            } else {
                index += 1;
            }
        }
    }

    if matches.is_empty() {
        return text.to_string();
    }

    matches.sort_by(|left, right| left.0.cmp(&right.0).then(right.1.cmp(&left.1)));

    let mut result = String::new();
    let mut cursor = 0;
    for (start, end, preferred) in matches {
        if start < cursor {
            continue;
        }
        result.extend(chars[cursor..start].iter());
        result.push_str(preferred);
        cursor = end;
    }
    result.extend(chars[cursor..].iter());
    result
}

fn bounded_match(chars: &[char], start: usize, needle: &[char]) -> bool {
    if start > 0 && is_term_char(chars[start - 1]) {
        return false;
    }
    let end = start + needle.len();
    if end < chars.len() && is_term_char(chars[end]) {
        return false;
    }
    chars[start..end]
        .iter()
        .zip(needle)
        .all(|(left, right)| equal_ignore_case_chars(*left, *right))
}

fn is_term_char(ch: char) -> bool {
    ch.is_alphanumeric() || ch == '_' || ch == '-'
}

/// `элсипишк*` or `автотрак* четвёрка`: the star consumes up to four Cyrillic letters.
fn stem_pattern(alias: &str) -> Option<(Vec<char>, Vec<char>)> {
    let star = alias.find('*')?;
    let after = &alias[star + '*'.len_utf8()..];
    if after.contains('*') || !(after.is_empty() || after.starts_with(' ')) {
        return None;
    }
    let stem: Vec<char> = alias[..star].chars().collect();
    if stem.is_empty() {
        return None;
    }
    Some((stem, after.chars().collect()))
}

fn find_stem_matches<'a>(
    chars: &[char],
    stem: &[char],
    rest: &[char],
    preferred: &'a str,
    matches: &mut Vec<(usize, usize, &'a str)>,
) {
    const MAX_ENDING: usize = 4;
    let mut index = 0;
    while index + stem.len() <= chars.len() {
        let stem_end = index + stem.len();
        let stem_matches = chars[..index].last().map(|ch| !is_term_char(*ch)).unwrap_or(true)
            && chars[index..stem_end]
                .iter()
                .zip(stem)
                .all(|(left, right)| equal_ignore_case_chars(*left, *right));

        if stem_matches {
            let mut matched_end = None;
            for extra in (0..=MAX_ENDING).rev() {
                let ending_end = stem_end + extra;
                let match_end = ending_end + rest.len();
                if match_end > chars.len() {
                    continue;
                }
                if extra > 0
                    && !chars[stem_end..ending_end]
                        .iter()
                        .all(|ch| is_cyrillic_letter(*ch))
                {
                    continue;
                }
                if chars[ending_end..match_end]
                    .iter()
                    .zip(rest)
                    .all(|(left, right)| equal_ignore_case_chars(*left, *right))
                    && chars
                        .get(match_end)
                        .map(|ch| !is_term_char(*ch))
                        .unwrap_or(true)
                {
                    matched_end = Some(match_end);
                    break;
                }
            }
            if let Some(match_end) = matched_end {
                matches.push((index, match_end, preferred));
                index = match_end;
                continue;
            }
        }
        index += 1;
    }
}

fn is_cyrillic_letter(ch: char) -> bool {
    matches!(ch, '\u{0400}'..='\u{04FF}')
}

fn equal_ignore_case(left: &str, right: &str) -> bool {
    let left_chars: Vec<char> = left.chars().collect();
    let right_chars: Vec<char> = right.chars().collect();
    left_chars.len() == right_chars.len()
        && left_chars
            .iter()
            .zip(right_chars)
            .all(|(left_char, right_char)| equal_ignore_case_chars(*left_char, right_char))
}

fn equal_ignore_case_chars(left: char, right: char) -> bool {
    if left == right {
        return true;
    }
    let left_lower: String = left.to_lowercase().collect();
    let right_lower: String = right.to_lowercase().collect();
    left_lower == right_lower
}

#[tauri::command]
pub fn get_user_glossary() -> String {
    current_text()
}

#[tauri::command]
pub fn set_user_glossary<R: Runtime>(app: AppHandle<R>, glossary: String) -> Result<(), String> {
    save(&app, &glossary)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_terms_definitions_and_replacements() {
        let parsed = parse_glossary(
            "# comment\nDrillOps\nWASAPI: windows audio\nдриллопс => DrillOps\nстенд => стендап (планёрка)\n",
        );

        assert_eq!(
            parsed.summary_text,
            "DrillOps\nWASAPI: windows audio\nдриллопс => DrillOps\nстенд => стендап (планёрка)"
        );
        assert_eq!(parsed.whisper_terms, vec!["DrillOps", "WASAPI", "стендап"]);
        assert_eq!(
            parsed.replacements,
            vec![
                ("дриллопс".to_string(), "DrillOps".to_string()),
                ("стенд".to_string(), "стендап".to_string()),
            ]
        );
    }

    #[test]
    fn replacements_keep_word_boundaries_and_ignore_case() {
        let rules = vec![
            ("wasapi".to_string(), "WASAPI".to_string()),
            ("стенд".to_string(), "стендап".to_string()),
        ];

        assert_eq!(
            apply_replacements("Проверили Wasapi и стендап, потом стенд.", &rules),
            "Проверили WASAPI и стендап, потом стендап."
        );
    }

    #[test]
    fn longer_alias_wins_when_phrases_overlap() {
        let rules = vec![
            ("foo bar".to_string(), "FooBar".to_string()),
            ("foo".to_string(), "FOO".to_string()),
        ];
        let mut sorted = rules;
        sorted.sort_by(|left, right| right.0.chars().count().cmp(&left.0.chars().count()));

        assert_eq!(apply_replacements("foo bar and foo", &sorted), "FooBar and FOO");
    }

    #[test]
    fn whisper_prompt_uses_preferred_spellings_only() {
        assert_eq!(
            whisper_initial_prompt_from("дриллопс => DrillOps\n# ignore\nWASAPI\n").as_deref(),
            Some("DrillOps, WASAPI")
        );
    }

    #[test]
    fn empty_glossary_adds_no_terms_or_replacements() {
        let parsed = parse_glossary("   \n# only a comment\n");
        assert!(parsed.summary_text.is_empty());
        assert!(parsed.whisper_terms.is_empty());
        assert!(parsed.replacements.is_empty());
        assert_eq!(whisper_initial_prompt_from(""), None);
        assert_eq!(apply_replacements("стенд", &[]), "стенд");
    }

    #[test]
    fn star_matches_russian_case_endings_only() {
        let rules = vec![
            ("элсипишк*".to_string(), "LCP".to_string()),
            ("автотрак* четвёрка".to_string(), "ATK 4.75".to_string()),
            ("автотрак*".to_string(), "ATK".to_string()),
        ];

        assert_eq!(
            apply_replacements("Сняли элсипишку и элсипишки, поставили элсипишками.", &rules),
            "Сняли LCP и LCP, поставили LCP."
        );
        assert_eq!(
            apply_replacements("автотрака четвёрка и автотрак четвёрка", &rules),
            "ATK 4.75 и ATK 4.75"
        );
        assert_eq!(apply_replacements("неэлсипишка", &rules), "неэлсипишка");
    }
}
