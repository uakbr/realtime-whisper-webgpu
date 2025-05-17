function titleCase(str) {
  str = str.toLowerCase();
  return (str.match(/\w+.?/g) || [])
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

// List of supported languages:
// https://help.openai.com/en/articles/7031512-whisper-api-faq
// https://github.com/openai/whisper/blob/248b6cb124225dd263bb9bd32d060b6517e067f8/whisper/tokenizer.py#L79
const LANGUAGES = {
  en: "english",
  zh: "chinese",
  de: "german",
  es: "spanish/castilian",
  ru: "russian",
  ko: "korean",
  fr: "french",
  ja: "japanese",
  pt: "portuguese",
  tr: "turkish",
  pl: "polish",
  ca: "catalan/valencian",
  nl: "dutch/flemish",
  ar: "arabic",
  sv: "swedish",
  it: "italian",
  id: "indonesian",
  hi: "hindi",
  fi: "finnish",
  vi: "vietnamese",
  he: "hebrew",
  uk: "ukrainian",
  el: "greek",
  ms: "malay",
  cs: "czech",
  ro: "romanian/moldavian/moldovan",
  da: "danish",
  hu: "hungarian",
  ta: "tamil",
  no: "norwegian",
  th: "thai",
  ur: "urdu",
  hr: "croatian",
  bg: "bulgarian",
  lt: "lithuanian",
  la: "latin",
  mi: "maori",
  ml: "malayalam",
  cy: "welsh",
  sk: "slovak",
  te: "telugu",
  fa: "persian",
  lv: "latvian",
  bn: "bengali",
  sr: "serbian",
  az: "azerbaijani",
  sl: "slovenian",
  kn: "kannada",
  et: "estonian",
  mk: "macedonian",
  br: "breton",
  eu: "basque",
  is: "icelandic",
  hy: "armenian",
  ne: "nepali",
  mn: "mongolian",
  bs: "bosnian",
  kk: "kazakh",
  sq: "albanian",
  sw: "swahili",
  gl: "galician",
  mr: "marathi",
  pa: "punjabi/panjabi",
  si: "sinhala/sinhalese",
  km: "khmer",
  sn: "shona",
  yo: "yoruba",
  so: "somali",
  af: "afrikaans",
  oc: "occitan",
  ka: "georgian",
  be: "belarusian",
  tg: "tajik",
  sd: "sindhi",
  gu: "gujarati",
  am: "amharic",
  yi: "yiddish",
  lo: "lao",
  uz: "uzbek",
  fo: "faroese",
  ht: "haitian creole/haitian",
  ps: "pashto/pushto",
  tk: "turkmen",
  nn: "nynorsk",
  mt: "maltese",
  sa: "sanskrit",
  lb: "luxembourgish/letzeburgesch",
  my: "myanmar/burmese",
  bo: "tibetan",
  tl: "tagalog",
  mg: "malagasy",
  as: "assamese",
  tt: "tatar",
  haw: "hawaiian",
  ln: "lingala",
  ha: "hausa",
  ba: "bashkir",
  jw: "javanese",
  su: "sundanese",
};

// Common languages to show at the top of the list
const COMMON_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ru', 'ar', 'hi', 'pt'];

export function LanguageSelector({ language, setLanguage }) {
  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const names = Object.values(LANGUAGES).map(titleCase);
  
  // Create a sorted list with common languages at the top
  const sortedLanguages = Object.keys(LANGUAGES).sort((a, b) => {
    const aIsCommon = COMMON_LANGUAGES.includes(a);
    const bIsCommon = COMMON_LANGUAGES.includes(b);
    
    if (aIsCommon && !bIsCommon) return -1;
    if (!aIsCommon && bIsCommon) return 1;
    
    // For common languages, maintain the order in COMMON_LANGUAGES
    if (aIsCommon && bIsCommon) {
      return COMMON_LANGUAGES.indexOf(a) - COMMON_LANGUAGES.indexOf(b);
    }
    
    // For other languages, sort alphabetically by name
    return LANGUAGES[a].localeCompare(LANGUAGES[b]);
  });
  
  // Get the index mapping for the sorted languages
  const indexMapping = sortedLanguages.map(key => Object.keys(LANGUAGES).indexOf(key));

  return (
    <select
      className="border rounded-lg p-1 sm:p-2 text-xs sm:text-sm max-w-[100px] sm:max-w-[150px]"
      value={language}
      onChange={handleLanguageChange}
      aria-label="Select language"
    >
      {sortedLanguages.map((key, i) => {
        const nameIndex = indexMapping[i];
        const displayName = names[nameIndex];
        const isCommon = COMMON_LANGUAGES.includes(key);
        
        return (
          <option key={key} value={key} className={isCommon ? "font-medium" : ""}>
            {displayName}
          </option>
        );
      })}
    </select>
  );
}
