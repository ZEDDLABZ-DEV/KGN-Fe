export interface PageHelpCopy {
  titleEn: string
  titleHi: string
  en: string
  hi: string
  featuresEn: string[]
  featuresHi: string[]
}

const PAGE_HELP: Record<string, PageHelpCopy> = {
  '/': {
    titleEn: 'Dashboard',
    titleHi: 'डैशबोर्ड',
    en: 'This is the home screen. It gives you a quick picture of your construction work so you know what needs attention today.',
    hi: 'यह होम स्क्रीन है। यहाँ आपके निर्माण काम का आसान सार दिखता है, ताकि आज किन बातों पर ध्यान देना है वो साफ रहे।',
    featuresEn: [
      'See how many projects and tasks are running',
      'Check pending material buying and stock alerts',
      'Look at recent activity and upcoming work',
    ],
    featuresHi: [
      'देखें कितने प्रोजेक्ट और काम चल रहे हैं',
      'सामग्री की खरीद और स्टॉक की चेतावनी देखें',
      'हाल की गतिविधि और आने वाला काम देखें',
    ],
  },
  '/projects': {
    titleEn: 'Projects',
    titleHi: 'प्रोजेक्ट',
    en: 'Use this page to add and manage construction sites. All project work stays in one place.',
    hi: 'इस पेज से निर्माण साइट जोड़ें और उनकी देखरेख करें। सारा प्रोजेक्ट काम एक जगह रहता है।',
    featuresEn: [
      'Create a new project / site',
      'See status of each project',
      'Open a project to manage its work',
    ],
    featuresHi: [
      'नया प्रोजेक्ट / साइट बनाएँ',
      'हर प्रोजेक्ट की स्थिति देखें',
      'प्रोजेक्ट खोलकर उसका काम संभालें',
    ],
  },
  '/teams': {
    titleEn: 'Teams',
    titleHi: 'टीम',
    en: 'Use this page to make teams and put people on projects, so everyone knows who is working on which site.',
    hi: 'इस पेज से टीमें बनाएँ और लोगों को प्रोजेक्ट पर लगाएँ, ताकि साफ रहे कौन किस साइट पर काम कर रहा है।',
    featuresEn: [
      'Create a team',
      'Add members to a team',
      'Link teams to projects',
    ],
    featuresHi: [
      'टीम बनाएँ',
      'टीम में सदस्य जोड़ें',
      'टीम को प्रोजेक्ट से जोड़ें',
    ],
  },
  '/tasks': {
    titleEn: 'Tasks',
    titleHi: 'काम (टास्क)',
    en: 'Use this page to create site work, give it to people, and track what is pending, late, or completed.',
    hi: 'इस पेज से साइट का काम बनाएँ, लोगों को दें, और देखें क्या बाकी है, लेट है या पूरा हो गया।',
    featuresEn: [
      'Create and assign tasks',
      'Set dates and priority',
      'Track pending, overdue, and completed work',
    ],
    featuresHi: [
      'टास्क बनाएँ और लोगों को दें',
      'तारीख और प्राथमिकता तय करें',
      'बाकी, लेट और पूरा काम ट्रैक करें',
    ],
  },
  '/daily-reports': {
    titleEn: 'Daily Reports',
    titleHi: 'रोज़ की रिपोर्ट',
    en: 'This page is for daily site reports. Admins can see what work happened today, with notes and photos from the field.',
    hi: 'यह पेज रोज़ की साइट रिपोर्ट के लिए है। एडमिन यहाँ देख सकते हैं आज क्या काम हुआ, साथ में नोट्स और साइट की फोटो भी।',
    featuresEn: [
      'Read daily progress from the site',
      'See photos attached to reports',
      'Filter reports by project or date',
    ],
    featuresHi: [
      'साइट की रोज़ की प्रगति पढ़ें',
      'रिपोर्ट के साथ लगी फोटो देखें',
      'प्रोजेक्ट या तारीख से रिपोर्ट छाँटें',
    ],
  },
  '/attendance': {
    titleEn: 'Attendance',
    titleHi: 'हाजिरी',
    en: 'Use this page to mark workers present or absent and check attendance for any date or project.',
    hi: 'इस पेज से मजदूरों की हाजिरी लगाएँ और किसी भी तारीख या प्रोजेक्ट की उपस्थिति देखें।',
    featuresEn: [
      'Mark present or absent for workers',
      'Check attendance by date or project',
      'Review who came to site',
    ],
    featuresHi: [
      'मजदूरों को हाजिर या गैरहाजिर करें',
      'तारीख या प्रोजेक्ट से हाजिरी देखें',
      'कौन साइट पर आया, ये जाँचें',
    ],
  },
  '/users': {
    titleEn: 'Users',
    titleHi: 'यूज़र्स',
    en: 'Use this page to add office people like engineers, managers, and accountants, and give them a role so they can log in with the right access.',
    hi: 'इस पेज से दफ्तर के लोग जोड़ें — जैसे इंजीनियर, मैनेजर, अकाउंटेंट — और उनकी भूमिका चुनें, ताकि सही अधिकार के साथ लॉगिन कर सकें।',
    featuresEn: [
      'Add or edit office users',
      'Assign a role to each user',
      'Reset login password when needed',
    ],
    featuresHi: [
      'दफ्तर के यूज़र जोड़ें या बदलें',
      'हर यूज़र को भूमिका दें',
      'ज़रूरत पड़ने पर पासवर्ड रीसेट करें',
    ],
  },
  '/workers': {
    titleEn: 'Workers',
    titleHi: 'मजदूर',
    en: 'Use this page to add site workers (labours) — the people who do the physical work on site.',
    hi: 'इस पेज से साइट के मजदूर जोड़ें — जो साइट पर हाथ का काम करते हैं।',
    featuresEn: [
      'Add a new worker',
      'Edit worker details',
      'Keep a list of site labour',
    ],
    featuresHi: [
      'नया मजदूर जोड़ें',
      'मजदूर की जानकारी बदलें',
      'साइट के मजदूरों की सूची रखें',
    ],
  },
  '/vendors': {
    titleEn: 'Vendors',
    titleHi: 'वेंडर',
    en: 'Use this page to add vendors — the shops and suppliers from where you get cement, steel, and other materials. New vendors wait for admin approval before they can be used on purchase orders.',
    hi: 'इस पेज से वेंडर जोड़ें — वो दुकानें और सप्लायर जिनसे सीमेंट, स्टील और दूसरी सामग्री आती है। नया वेंडर खरीद ऑर्डर में तभी आएगा जब एडमिन उसे मंजूर करे।',
    featuresEn: [
      'Add a vendor with name and contact person',
      'Save phone, email, address, GST and PAN',
      'Admins approve or reject vendors; only active approved vendors appear when creating a PO',
    ],
    featuresHi: [
      'वेंडर का नाम और संपर्क व्यक्ति जोड़ें',
      'फोन, ईमेल, पता, GST और PAN सेव करें',
      'एडमिन वेंडर को मंजूर या नामंजूर करता है; PO पर सिर्फ एक्टिव मंजूर वेंडर दिखते हैं',
    ],
  },
  '/roles-permissions': {
    titleEn: 'Roles & Permissions',
    titleHi: 'भूमिका और अधिकार',
    en: 'Use this page to decide what each role can see and do in the software, so people only get the access they need.',
    hi: 'इस पेज से तय करें कि हर भूमिका सॉफ्टवेयर में क्या देख और कर सकती है, ताकि हर किसी को सिर्फ ज़रूरी अधिकार मिलें।',
    featuresEn: [
      'See roles in the company',
      'Turn permissions on or off for a role',
      'Keep data safe by limiting extra access',
    ],
    featuresHi: [
      'कंपनी की भूमिकाएँ देखें',
      'किसी भूमिका के अधिकार चालू या बंद करें',
      'अतिरिक्त एक्सेस रोककर डेटा सुरक्षित रखें',
    ],
  },
  '/boq': {
    titleEn: 'BOQ Upload',
    titleHi: 'BOQ अपलोड',
    en: 'Use this page to upload the Bill of Quantities (BOQ) for a project — the list of materials and how much of each is needed.',
    hi: 'इस पेज से प्रोजेक्ट का BOQ अपलोड करें — यानी सामग्री की सूची और हर चीज़ कितनी मात्रा में चाहिए।',
    featuresEn: [
      'Choose a project',
      'Upload the BOQ file',
      'Use this list later for material requests',
    ],
    featuresHi: [
      'प्रोजेक्ट चुनें',
      'BOQ फाइल अपलोड करें',
      'बाद में सामग्री माँगने के लिए यही सूची उपयोग करें',
    ],
  },
  '/material-requests': {
    titleEn: 'Material Requests',
    titleHi: 'सामग्री की माँग',
    en: 'Use this page when the site needs material. You raise a request, get it approved, and then buying can start.',
    hi: 'जब साइट को सामग्री चाहिए तब इस पेज का उपयोग करें। आप रिक्वेस्ट बनाते हैं, अप्रूवल लेते हैं, फिर खरीद शुरू हो सकती है।',
    featuresEn: [
      'Create a material request for a project',
      'Send it for approval',
      'Track whether it is pending, approved, or fulfilled',
    ],
    featuresHi: [
      'प्रोजेक्ट के लिए सामग्री की रिक्वेस्ट बनाएँ',
      'अप्रूवल के लिए भेजें',
      'देखें रिक्वेस्ट बाकी है, मंजूर है या पूरी हो गई',
    ],
  },
  '/file-manager': {
    titleEn: 'File Manager',
    titleHi: 'फाइल मैनेजर',
    en: 'Use this page to keep project files — drawings, bills, and photos — so the team can find them easily.',
    hi: 'इस पेज पर प्रोजेक्ट की फाइलें रखें — ड्रॉइंग, बिल और फोटो — ताकि टीम आसानी से ढूंढ सके।',
    featuresEn: [
      'Upload documents for a project',
      'Open or download files',
      'Keep drawings and bills organised',
    ],
    featuresHi: [
      'प्रोजेक्ट के दस्तावेज़ अपलोड करें',
      'फाइल खोलें या डाउनलोड करें',
      'ड्रॉइंग और बिल व्यवस्थित रखें',
    ],
  },
  '/purchase-orders': {
    titleEn: 'Purchase Orders',
    titleHi: 'खरीद ऑर्डर',
    en: 'Use this page to create a purchase order (PO) to buy materials from a vendor, send it, and track what has been ordered.',
    hi: 'इस पेज से वेंडर से सामग्री खरीदने का ऑर्डर (PO) बनाएँ, भेजें, और देखें क्या मंगवाया गया है।',
    featuresEn: [
      'Create a PO from approved material needs',
      'Choose vendor and items',
      'Track whether the order is sent or received',
    ],
    featuresHi: [
      'मंजूर सामग्री से PO बनाएँ',
      'वेंडर और आइटम चुनें',
      'देखें ऑर्डर भेजा गया है या माल आ गया है',
    ],
  },
  '/grn': {
    titleEn: 'GRN',
    titleHi: 'GRN (माल मिलने का रिकॉर्ड)',
    en: 'GRN means Goods Receipt Note. Use this page when material arrives on site — record what was received and check the quantity against the purchase order.',
    hi: 'GRN यानी माल मिलने का रिकॉर्ड। जब साइट पर सामग्री आए, तो यहाँ लिखें क्या और कितना माल मिला, और खरीद ऑर्डर से मिलाकर जाँचें।',
    featuresEn: [
      'Record material received on site',
      'Match quantity with the purchase order',
      'See pending and completed GRNs',
    ],
    featuresHi: [
      'साइट पर मिला माल दर्ज करें',
      'मात्रा को खरीद ऑर्डर से मिलाएँ',
      'बाकी और पूरे GRN देखें',
    ],
  },
  '/inventory': {
    titleEn: 'Inventory',
    titleHi: 'स्टॉक / इन्वेंटरी',
    en: 'Use this page to see material stock — how much is on site, what is running low, and what was issued for work.',
    hi: 'इस पेज पर सामग्री का स्टॉक देखें — साइट पर कितना माल है, क्या कम पड़ रहा है, और काम के लिए कितना दिया गया।',
    featuresEn: [
      'See stock by material and by project',
      'Issue material for site work',
      'Get alerts when stock is low',
    ],
    featuresHi: [
      'सामग्री और प्रोजेक्ट के हिसाब से स्टॉक देखें',
      'साइट के काम के लिए माल जारी करें',
      'स्टॉक कम होने पर चेतावनी पाएँ',
    ],
  },
  '/units': {
    titleEn: 'Units of Measurement',
    titleHi: 'माप की इकाई',
    en: 'Use this page to manage units like kg, bag, and cubic meter, so quantities are written the same way everywhere.',
    hi: 'इस पेज पर इकाई सेट करें — जैसे किलो, बैग, घन मीटर — ताकि मात्रा हर जगह एक ही तरीके से लिखी जाए।',
    featuresEn: [
      'Add units used on site (kg, bag, m³)',
      'Rename or disable a unit',
      'Keep quantity names consistent in BOQ, PO and stock',
    ],
    featuresHi: [
      'साइट पर इस्तेमाल होने वाली इकाई जोड़ें (किलो, बैग, घन मीटर)',
      'इकाई का नाम बदलें या बंद करें',
      'BOQ, PO और स्टॉक में मात्रा एक जैसे लिखी रहे',
    ],
  },
  '/procurement': {
    titleEn: 'Procurement Pipeline',
    titleHi: 'खरीद की पूरी यात्रा',
    en: 'Use this page to see the full buying journey — from material request to purchase order to delivery — and find where work is stuck.',
    hi: 'इस पेज पर खरीद की पूरी यात्रा देखें — सामग्री की माँग से ऑर्डर और डिलीवरी तक — और पता करें काम कहाँ रुका है।',
    featuresEn: [
      'See requests waiting for approval',
      'See orders waiting for delivery',
      'See material waiting for GRN / inspection',
    ],
    featuresHi: [
      'अप्रूवल के इंतज़ार में रिक्वेस्ट देखें',
      'डिलीवरी के इंतज़ार में ऑर्डर देखें',
      'GRN / जाँच के इंतज़ार में माल देखें',
    ],
  },
  '/settings': {
    titleEn: 'Settings',
    titleHi: 'सेटिंग',
    en: 'Use this page for account settings, such as changing the admin password.',
    hi: 'यह पेज खाते की सेटिंग के लिए है, जैसे एडमिन का पासवर्ड बदलना।',
    featuresEn: [
      'Change admin password',
      'Keep the account secure',
    ],
    featuresHi: [
      'एडमिन पासवर्ड बदलें',
      'खाता सुरक्षित रखें',
    ],
  },
}

const DEFAULT_HELP: PageHelpCopy = {
  titleEn: 'This page',
  titleHi: 'यह पेज',
  en: 'This page is part of the KGN admin panel. Use the menus on the left to manage your construction work.',
  hi: 'यह पेज KGN एडमिन पैनल का हिस्सा है। बाईं तरफ के मेन्यू से अपना निर्माण काम संभालें।',
  featuresEn: ['Open a menu on the left to start work'],
  featuresHi: ['काम शुरू करने के लिए बाईं तरफ का मेन्यू खोलें'],
}

export const getPageHelp = (pathname: string): PageHelpCopy => {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return PAGE_HELP[normalized] ?? DEFAULT_HELP
}
