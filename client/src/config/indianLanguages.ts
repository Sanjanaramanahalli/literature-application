export interface IndianLanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  wiki: string;
  scriptRegex?: RegExp;
}

export const SUPPORTED_INDIAN_LANGUAGES: IndianLanguageConfig[] = [
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', wiki: 'kn.wikipedia.org', scriptRegex: /[\u0C80-\u0CFF]/ },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', wiki: 'hi.wikipedia.org', scriptRegex: /[\u0900-\u097F]/ },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', wiki: 'ta.wikipedia.org', scriptRegex: /[\u0B80-\u0BFF]/ },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', wiki: 'te.wikipedia.org', scriptRegex: /[\u0C00-\u0C7F]/ },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', wiki: 'ml.wikipedia.org', scriptRegex: /[\u0D00-\u0D7F]/ },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', wiki: 'mr.wikipedia.org', scriptRegex: /[\u0900-\u097F]/ },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', wiki: 'bn.wikipedia.org', scriptRegex: /[\u0980-\u09FF]/ },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', wiki: 'gu.wikipedia.org', scriptRegex: /[\u0A80-\u0AFF]/ },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', wiki: 'pa.wikipedia.org', scriptRegex: /[\u0A00-\u0A7F]/ },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', wiki: 'or.wikipedia.org', scriptRegex: /[\u0B00-\u0B7F]/ },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', wiki: 'as.wikipedia.org', scriptRegex: /[\u0980-\u09FF]/ },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', wiki: 'sa.wikipedia.org', scriptRegex: /[\u0900-\u097F]/ },
  { code: 'gom', name: 'Konkani', nativeName: 'कोंकणी', wiki: 'gom.wikipedia.org', scriptRegex: /[\u0900-\u097F]/ },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर', wiki: 'ks.wikipedia.org' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', wiki: 'ne.wikipedia.org', scriptRegex: /[\u0900-\u097F]/ },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي / सिन्धी', wiki: 'sd.wikipedia.org' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', wiki: 'mai.wikipedia.org', scriptRegex: /[\u0900-\u097F]/ },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্ / ꯃꯤꯇꯩꯂꯣꯟ', wiki: 'mni.wikipedia.org', scriptRegex: /[\uABC0-\uABFF\u0980-\u09FF]/ },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', wiki: 'sat.wikipedia.org', scriptRegex: /[\u1C50-\u1C7F]/ },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', wiki: 'doi.wikipedia.org', scriptRegex: /[\u0900-\u097F]/ },
  { code: 'en', name: 'English (Classical Literature)', nativeName: 'English', wiki: 'en.wikipedia.org' },
];

export const SUPPORTED_INDIAN_LANGUAGE_CODES = new Set(SUPPORTED_INDIAN_LANGUAGES.map((l) => l.code));

export function getIndianLanguageByCode(code: string): IndianLanguageConfig | undefined {
  if (!code) return undefined;
  const clean = code.toLowerCase().trim();
  return SUPPORTED_INDIAN_LANGUAGES.find((l) => l.code === clean);
}

// Mapping of keywords and literary titles/authors in Latin script for accurate auto-detection
const LATIN_INDIAN_LITERATURE_KEYWORDS: { code: string; pattern: RegExp }[] = [
  // Kannada
  {
    code: 'kn',
    pattern: /\b(kannada|kuvempu|bendre|da\s*ra\s*bendre|karanth|kota\s*shivarama\s*karanth|masti|venkatesha\s*iyengar|tejaswi|poornachandra\s*tejaswi|gokak|vinayaka\s*krishna\s*gokak|anandamurthy|u\s*r\s*ananthamurthy|kambar|chandrashekhara\s*kambara|kambara|pampa|ranna|janna|ponna|harihara|raghavanka|kumaravyasa|sarvajna|basavanna|basaveshwara|allama\s*prabhu|akramahadevi|akko?mahad?evi|vachana|vachanas|kanakadasa|purandaradasa|dasa\s*sahitya|malegalalli\s*madumagalu|kanuru\s*heggadati|karvalo|chomana\s*dudi|mookajjiya\s*kanasugalu|samskara|bharatha\s*kathamanjari|kavirajamarga|yayati|doddarange\s*gowda|bhyrappa|s\s*l\s*bhyrappa|aavarana|parva|vamsa\s*vriksha|mandara\s*ramayana|halmidi)\b/i,
  },
  // Hindi
  {
    code: 'hi',
    pattern: /\b(hindi|premchand|munshi\s*premchand|godan|gaban|nirmala|karmabhoomi|sewasadan|rangbhoomi|mansarovar|tulsidas|tulsi\s*das|ramcharitmanas|surdas|soordas|sur\s*sagar|kabir|kabirdas|kabir\s*ke\s*dohe|doha|dohas|bihari\s*satsai|harivansh\s*rai\s*bachchan|madhushala|jaishankar\s*prasad|kamayani|mahadevi\s*varma|yama|chhayavad|ramdhari\s*singh\s*dinkar|rashmirathi|kurukshetra|urvashi|suryakant\s*tripathi\s*nirala|anamika|parimal|bharatendu\s*harishchandra|andher\s*nagari|hazariprasad\s*dwivedi|baanbhatt\s*ki\s*aatmakatha|phanishwar\s*nath\s*renu|maila\s*aanchal|bhagwati\s*charan\s*verma|chitralekha|agyeya|shekhar\s*ek\s*jeevani|mohan\s*rakesh|ashadh\s*ka\s*ek\s*din|adhe\s*adhure|upendranath\s*ashk|amritlal\s*nagar|khari\s*boli|brajbhasha|awadhi)\b/i,
  },
  // Tamil
  {
    code: 'ta',
    pattern: /\b(tamil|thirukkural|tirukkural|kural|thiruvalluvar|tiruvalluvar|silappadikaram|cilappatikaram|ilango\s*adigal|manimekalai|sathanar|sivaka\s*cintamani|valayapathi|kundalakesi|kambar|kamba\s*ramayanam|avvaiyar|subramania\s*bharati|bharathiyar|bharathidasan|kalki|kalki\s*krishnamurthy|ponniyin\s*selvan|sivagamiyin\s*sabatham|parthiban\s*kanavu|pudhumaipithan|akilan|jayakanthan|sujatha|vairamuthu|sangam\s*literature|tholkappiyam|tolkappiyam|agananooru|purananooru|natrinai|kurunthogai|thiruvasagam|manickavasagar|devaram|thevaram|divya\s*prabandham|andal|thiruppavai|periya\s*puranam|sekki?zhar)\b/i,
  },
  // Telugu
  {
    code: 'te',
    pattern: /\b(telugu|nannaya|tikkana|yerrana|kavitrayam|andhra\s*mahabharatam|potana|bammera\s*potana|andhra\s*maha\s*bhagavatham|bhagavatam|vemana|vemana\s*satakam|sumati\s*satakam|baddena|allasaani\s*peddana|manucharitra|sri\s*krishna\s*devaraya|amuktamalyada|tenali\s*rama|tenali\s*ramakrishna|panduranga\s*mahatmyam|dhuryati|sri\s*sri|srirangam\s*srinivasa\s*rao|maha\s*prasthanam|gurajada|gurajada\s*apparao|kanyasulkam|kanya\s*sulkam|viswanatha\s*satyanarayana|ramayana\s*kalpavrukshamu|chalam|gudipati\s*venkatachalam|tilak|devarakonda\s*balagangadhara\s*tilak|amrutham\s*kurisina\s*rathri|seshendra\s*sharma|anamaiah|tallapaka\s*annamacharya|khetrayya|tyagaraja)\b/i,
  },
  // Malayalam
  {
    code: 'ml',
    pattern: /\b(malayalam|ezhuthachan|thunchaththu\s*ezhuthachan|adhyatma\s*ramayanam|cherusseri|krishnagatha|kunchan\s*nambiar|thullal|kumaran\s*asan|karuna|veena\s*poovu|vallathol|vallathol\s*narayana\s*menon|ulloor|s\s*parameshwara\s*iyer|thakazhi|sivasankara\s*pillai|chemmeen|kayar|basheer|vaikom\s*muhammad\s*basheer|balyakalasakhi|pathummayude\s*aadu|m\s*t\s*vasudevan\s*nair|randamoozham|varanasi|kaalam|ov\s*vijayan|khasakkinte\s*ithihasam|sk\s*pottekkatt|oru\s*desathinte\s*katha|madhavikutty|kamala\s*das|sankara\s*kurup|odakkuzhal|b\s*balachandran\s*chullikkad|benyamin|aadujeevitham|goat\s*days)\b/i,
  },
  // Marathi
  {
    code: 'mr',
    pattern: /\b(marathi|sant\s*dnyaneshwar|dnyaneshwari|bhavartha\s*deepika|sant\s*tukaram|tukaram\s*gatha|abhang|abhangas|sant\s*namdev|sant\s*eknath|bhavarth\s*ramayan|samarth\s*ramdas|dasbodh|manache\s*shlok|keshavsut|balakavi|kusumagraj|vishnu\s*vaman\s*shirwadkar|natasamrat|vinda\s*karandikar|b\s*s\s*mardhekar|pu\s*la\s*deshpande|purushottam\s*laxman\s*deshpande|batatyachi\s*chal|vyakti\s*ani\s*valli|shivaji\s*sawant|mrityunjay|yugandhar|vishwas\s*patil|panipat|mahanayak|v\s*s\s*khandekar|yayati|bhalchandra\s*nemade|kosla|hindu|arun\s*kolatkar|namdeo\s*dhasal|golpitha|shanta\s*shelke|bahinabai\s*chaudhary)\b/i,
  },
  // Bengali
  {
    code: 'bn',
    pattern: /\b(bengali|bangla|rabindranath\s*tagore|tagore|gitanjali|geetanjali|kabuliwala|ghare\s*baire|home\s*and\s*the\s*world|chokher\s*bali|gora|sonar\s*tori|dakghar|post\s*office|sarat\s*chandra\s*chattopadhyay|devdas|charitraheen|srikanta|pather\s*dabi|parineeta|bankim\s*chandra\s*chattopadhyay|anandamath|vande\s*mataram|durgeshnandini|kapalkundala|kazi\s*nazrul\s*islam|bidrohi|agnibeena|michael\s*madhusudan\s*dutt|meghnad\s*badh\s*kavya|bibhutibhushan\s*bandyopadhyay|pather\s*panchali|aparajito|aranyak|tarasankar\s*bandyopadhyay|manik\s*bandyopadhyay|sukanta\s*bhattacharya|sunil\s*gangopadhyay|shei\s*somoy|shankha\s*ghosh|joy\s*goswami|charyapada|krittibas\s*ojha)\b/i,
  },
  // Gujarati
  {
    code: 'gu',
    pattern: /\b(gujarati|narsinh\s*mehta|vaishnava\s*jana\s*to|akho|premanand\s*bhatt|shamal\s*bhatt|dalpatram|narmad|govardhanram\s*tripathi|saraswatichandra|kanaiyalal\s*munshi|patanni\s*prabhuta|gujaratno\s*nath|prithvi\s*vallabh|zaverchand\s*meghani|saurashtrani\s*rasdhar|kavya\s*kallolini|umashankar\s*joshi|nishith|sundaram|pannalal\s*patel|manvini\s*bhavai|malela\s*jeev|rajendra\s*shah|dhruv\s*bhatt|chandrakant\s*bakshi|suresh\s*joshi|sitanshu\s*yashaschandra)\b/i,
  },
  // Punjabi
  {
    code: 'pa',
    pattern: /\b(punjabi|gurmukhi|waris\s*shah|heer\s*ranjha|bulleh\s*shah|baba\s*farid|shah\s*hussain|guru\s*nanak\s*bani|japji\s*sahib|guru\s*granth\s*sahib|bhai\s*vir\s*singh|dhani\s*ram\s*chatrik|amrita\s*pritam|pinjar|aj\s*aakhan\s*waris\s*shah\s*nu|kagaz\s*te\s*canvas|shiv\s*kumar\s*batalvi|loona|peeran\s*da\s*paraga|pash|avtar\s*singh\s*pash|surjit\s*patar|gurdial\s*singh|marhi\s*da\s*deeva|anhe\s*ghore\s*da\s*daan|kulwant\s*singh\s*virk|kartar\s*singh\s*duggal|qissa)\b/i,
  },
  // Odia
  {
    code: 'or',
    pattern: /\b(odia|orissa|sarala\s*dasa|sarala\s*mahabharata|jagannatha\s*dasa|odia\s*bhagabata|upendra\s*bhanja|baidehisa\s*vilasa|lavanyabati|kavisurya\s*baladev\s*ratha|fakir\s*mohan\s*senapati|chha\s*mana\s*atha\s*guntha|rebati|lachhama|radhanath\s*ray|chandrabhaga|chilika|gangadhar\s*meher|tapaswini|pranaya\s*vallari|gopinath\s*mohanty|paraja|amrutara\s*santana|danapani|matira\s*matala|sachi\s*routroy|sitakant\s*mahapatra|ramakanta\s*rath|pratibha\s*ray|yajnaseni)\b/i,
  },
  // Assamese
  {
    code: 'as',
    pattern: /\b(assamese|srimanta\s*sankardev|kirtan\s*ghosha|gunamala|madhavdev|namghosha|borgeet|bhattadeva|katha\s*gita|buranji|buranjis|lakshminath\s*bezbaroa|burhi\s*aair\s*sadhu|kripabar\s*barbarua|padmanath\s*gohain\s*baruah|hemchandra\s*barua|hemkosh|jyoti\s*prasad\s*agarwala|birendra\s*kumar\s*bhattacharya|mrityunjay\s*assamese|yaruingam|mamoni\s*raisom\s*goswami|the\s*moth\s*eaten\s*howdah\s*of\s*the\s*tusker|homen\s*borgohain|syed\s*abdul\s*malik)\b/i,
  },
  // Sanskrit
  {
    code: 'sa',
    pattern: /\b(sanskrit|kalidasa|abhijnanasakuntalam|shakuntala|meghaduta|raghuvamsha|kumarasambhava|rtusamhara|malavikagnimitram|bhasa|swapnavasavadattam|sudraka|mrcchakatika|mrichhakatika|dandin|dasakumaracarita|banabhatta|kadambari|harshacharita|bhavabhuti|uttararamacarita|malatimadhava|bharavi|kiratarjuniya|magha|sisupalavadha|sriharsha|naisadhiyacarita|vedas|rigveda|samaveda|yajurveda|atharvaveda|upanishad|upanishads|bhagavad\s*gita|gita|panchatantra|vishnu\s*sharma|hitopadesha|narayana\s*pandit|purana|puranas|valmiki|ramayana|vyasa|mahabharata|subhashita|kautilya|arthashastra|panini|ashtadhyayi|patanjali|yoga\s*sutras)\b/i,
  },
  // Konkani
  {
    code: 'gom',
    pattern: /\b(konkani|shenoi\s*goembab|ravindra\s*kelekar|amrutvel|damodar\s*mauzo|karmelin|tsunami\s*simon|uday\s*bhembre|chafra\s*dcosta|chandrakant\s*keni|edwin\s*jf\s*dsouza|triveni\s*konkani)\b/i,
  },
  // Kashmiri
  {
    code: 'ks',
    pattern: /\b(kashmiri|lal\s*ded|lalla|lalleshwari|vatsun|sheikh\s*noor\s*ud\s*din\s*wali|nund\s*rishi|habba\s*khatoon|arnimal|mahmood\s*gami|rasul\s*mir|mahjoor|ghulam\s*ahmad\s*mahjoor|zinda\s*kaul|rahman\s*rahi|nawroz\s*i\s*saba|siyah\s*rode\s*jaren\s*manz|akhtar\s*mohiuddin)\b/i,
  },
  // Nepali
  {
    code: 'ne',
    pattern: /\b(nepali|bhanubhakta\s*acharya|bhanubhakta\s*ramayana|motiram\s*bhatta|laxmi\s*prasad\s*devkota|muna\s*madan|shakuntala\s*nepali|balkrishna\s*sama|guru\s*prasad\s*mainali|naso|parijat|shirishko\s*phool|indra\s*bahadur\s*rai|aaja\s*ramita\s*chha|leela\s*dhwaj\s*thapa|bishweshwar\s*prasad\s*koirala|doshi\s*chashma|suman\s*pokhrel)\b/i,
  },
  // Sindhi
  {
    code: 'sd',
    pattern: /\b(sindhi|shah\s*abdul\s*latif\s*bhitai|shah\s*jo\s*risalo|sachal\s*sarmast|sami|chainrai\s*bachomal\s*lutf|kundan\s*lal\s*kundani|mirza\s*qilich\s*baig|kishanchand\s*bewas|narayan\s*shyam|popati\s*hiranandani|motilal\s*jotwani|lakhmi\s*khilani)\b/i,
  },
  // Maithili
  {
    code: 'mai',
    pattern: /\b(maithili|vidyapati|padavali|purusha\s*pariksha|chanda\s*jha|ramayana\s*maithili|harimohan\s*jha|khattar\s*kaka|kanyadan\s*maithili|dvidha|nagarjun\s*maithili|yatri|parichha\s*maithili|baidyanath\s*mishra|rajkamal\s*chaudhary|lalit\s*maithili)\b/i,
  },
  // Manipuri
  {
    code: 'mni',
    pattern: /\b(manipuri|meetei|meitei|hijam\s*anganghal|singbul|khamba\s*thoibi|khamba\s*thoibi\s*sheireng|kamal\s*singh|madhabi|elam\s*bam\s*dinamani|mk\s*binodini\s*devi|bor\s*saheb\s*ongbi\s*sanatombi|ch\s*manihar\s*singh|thangjam\s*ibopishak|yumlembam\s*ibomcha)\b/i,
  },
  // Santali
  {
    code: 'sat',
    pattern: /\b(santali|santhali|ol\s*chiki|raghunath\s*murmu|bidu\s*chandan|kherwal\s*bir|sadhu\s*ramchand\s*murmu|damayanti\s*beshra|joba\s*murmu|rabindranath\s*murmu)\b/i,
  },
  // Dogri
  {
    code: 'doi',
    pattern: /\b(dogri|dinu\s*bhai\s*pant|guttlun|padma\s*sachdev|meri\s*kavita\s*mere\s*geet|tavi\s*te\s*chanhan|ved\s*pal\s*deep|shiv\s*ram\s*deep|ram\s*nath\s*shastri|kavi\s*dattu)\b/i,
  },
];

export function detectIndianLanguageCode(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. Check distinct native Unicode scripts
  if (/[\u0C80-\u0CFF]/.test(trimmed)) return 'kn'; // Kannada script
  if (/[\u0B80-\u0BFF]/.test(trimmed)) return 'ta'; // Tamil script
  if (/[\u0C00-\u0C7F]/.test(trimmed)) return 'te'; // Telugu script
  if (/[\u0D00-\u0D7F]/.test(trimmed)) return 'ml'; // Malayalam script
  if (/[\u0A80-\u0AFF]/.test(trimmed)) return 'gu'; // Gujarati script
  if (/[\u0A00-\u0A7F]/.test(trimmed)) return 'pa'; // Punjabi (Gurmukhi script)
  if (/[\u0B00-\u0B7F]/.test(trimmed)) return 'or'; // Odia script
  if (/[\u1C50-\u1C7F]/.test(trimmed)) return 'sat'; // Santali (Ol Chiki script)
  if (/[\uABC0-\uABFF]/.test(trimmed)) return 'mni'; // Manipuri (Meetei Mayek script)

  // 2. Bengali / Assamese script (\u0980-\u09FF)
  if (/[\u09F0\u09F1]/.test(trimmed)) return 'as'; // Assamese specific letters (ra, wa)
  if (/[\u0980-\u09FF]/.test(trimmed)) return 'bn'; // Bengali / Assamese script

  // 3. Devanagari script (\u0900-\u097F)
  // Check for Marathi-specific characters (ळ: \u0933)
  if (/[\u0933]/.test(trimmed)) return 'mr';
  // Check for Sanskrit Vedic accents or Visarga / Virama heavy classical forms
  if (/[\u0951\u0952\u0903]/.test(trimmed) && /(?:अथ|नमः|स्वाहा|ऋग्वेद|स्तोत्र|संस्कृत)/.test(trimmed)) return 'sa';
  // Common Devanagari default to Hindi
  if (/[\u0900-\u097F]/.test(trimmed)) return 'hi';

  // 4. Roman / Latin transliterated Indian literature & author names, classics, or language names
  for (const entry of LATIN_INDIAN_LITERATURE_KEYWORDS) {
    if (entry.pattern.test(trimmed)) {
      return entry.code;
    }
  }

  return null;
}
