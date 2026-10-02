// English / Urdu switch.
//   const { t, lang, toggleLanguage } = useLanguage();
//   <h1>{t("searchTitle")}</h1>
// To translate more text: add a key to both "en" and "ur" below.
import { createContext, useContext, useEffect, useState } from "react";

const translations = {
  en: {
    // Navigation
    home: "Home",
    buy: "Buy",
    rent: "Rent",
    sell: "Sell",
    tools: "Tools",
    priceMap: "Price Map",
    about: "About",
    contact: "Contact",
    favorites: "Saved",
    dashboard: "My Listings",
    compare: "Compare",
    admin: "Admin",
    signIn: "Sign in",
    profile: "Profile",
    notifications: "Notifications",
    noNotifications: "No notifications yet",
    markAllRead: "Mark all as read",

    // Search
    propertiesForSale: "Properties for Sale",
    propertiesForRent: "Properties for Rent",
    searchSubtitle: "Hand-picked listings tailored to your lifestyle",
    anyType: "Any type",
    residential: "Residential",
    commercial: "Commercial",
    plot: "Plot",
    city: "City",
    minPrice: "Min price (PKR)",
    maxPrice: "Max price (PKR)",
    minBedrooms: "Min bedrooms",
    minBathrooms: "Min bathrooms",
    minArea: "Min area (Marla)",
    sortNewest: "Newest first",
    sortPriceLow: "Price: low to high",
    sortPriceHigh: "Price: high to low",
    sortAreaLarge: "Largest area",
    clearFilters: "Clear filters",
    alertMe: "Alert me",
    alertSaved: "Alert saved! We'll notify you about new matches.",
    noResults: "No Properties Found",
    noResultsHelp: "No properties match your current filters. Try adjusting your search.",
    loading: "Loading...",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    results: "results",

    // Property
    forSale: "For Sale",
    forRent: "For Rent",
    sold: "Sold",
    pending: "Waiting for approval",
    beds: "Beds",
    baths: "Baths",
    viewDetails: "View Details",
    call: "Call",
    whatsapp: "WhatsApp",
    sendEnquiry: "Send enquiry",
    share: "Share",
    report: "Report",
    location: "Location",
    description: "Description",
    postedBy: "Posted by",
    verified: "Verified",
    editListing: "Edit listing",
    addToCompare: "Compare",
    inCompare: "Comparing",
    recentlyViewed: "Recently viewed",
    emiCalculator: "Mortgage / EMI calculator",
    areaConverter: "Marla / Kanal / Sq. Ft. converter",

    // Forms
    whatToDo: "What do you want to do?",
    propertyKind: "What kind of property do you have?",
    title: "Property title",
    address: "Address, Block, Street...",
    size: "Size",
    price: "Price (PKR)",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    describe: "What do you love about your property?",
    photos: "Photos",
    yourName: "Your name",
    phone: "Phone number",
    email: "Email",
    message: "Message",
    publish: "Publish Property",
    saveChanges: "Save changes",
    uploading: "Uploading...",
    pinOnMap: "Pin the location on the map (optional)",

    // Dashboard
    myListings: "My Listings",
    enquiries: "Enquiries",
    alerts: "Alerts",
    markSold: "Mark as sold",
    markAvailable: "Mark as available",
    delete: "Delete",
    edit: "Edit",
    live: "Live",
    hidden: "Hidden",
  },

  ur: {
    home: "ہوم",
    buy: "خریدیں",
    rent: "کرایہ",
    sell: "بیچیں",
    tools: "ٹولز",
    priceMap: "قیمتوں کا نقشہ",
    about: "ہمارے بارے میں",
    contact: "رابطہ",
    favorites: "محفوظ",
    dashboard: "میری لسٹنگز",
    compare: "موازنہ",
    admin: "ایڈمن",
    signIn: "سائن ان",
    profile: "پروفائل",
    notifications: "اطلاعات",
    noNotifications: "ابھی کوئی اطلاع نہیں",
    markAllRead: "سب پڑھ لیا",

    propertiesForSale: "برائے فروخت جائیدادیں",
    propertiesForRent: "برائے کرایہ جائیدادیں",
    searchSubtitle: "آپ کے طرزِ زندگی کے مطابق منتخب جائیدادیں",
    anyType: "کوئی بھی قسم",
    residential: "رہائشی",
    commercial: "کمرشل",
    plot: "پلاٹ",
    city: "شہر",
    minPrice: "کم از کم قیمت",
    maxPrice: "زیادہ سے زیادہ قیمت",
    minBedrooms: "کم از کم بیڈروم",
    minBathrooms: "کم از کم باتھ روم",
    minArea: "کم از کم رقبہ (مرلہ)",
    sortNewest: "نئی پہلے",
    sortPriceLow: "قیمت: کم سے زیادہ",
    sortPriceHigh: "قیمت: زیادہ سے کم",
    sortAreaLarge: "بڑا رقبہ پہلے",
    clearFilters: "فلٹر صاف کریں",
    alertMe: "مجھے اطلاع دیں",
    alertSaved: "الرٹ محفوظ! نئی جائیداد ملنے پر ہم آپ کو بتائیں گے۔",
    noResults: "کوئی جائیداد نہیں ملی",
    noResultsHelp: "آپ کے فلٹرز سے کوئی جائیداد نہیں ملی۔ تلاش تبدیل کر کے دیکھیں۔",
    loading: "لوڈ ہو رہا ہے...",
    previous: "پچھلا",
    next: "اگلا",
    page: "صفحہ",
    of: "از",
    results: "نتائج",

    forSale: "برائے فروخت",
    forRent: "برائے کرایہ",
    sold: "فروخت ہو گیا",
    pending: "منظوری کا انتظار",
    beds: "بیڈ",
    baths: "باتھ",
    viewDetails: "تفصیل دیکھیں",
    call: "کال",
    whatsapp: "واٹس ایپ",
    sendEnquiry: "پیغام بھیجیں",
    share: "شیئر",
    report: "رپورٹ",
    location: "مقام",
    description: "تفصیل",
    postedBy: "پوسٹ کرنے والا",
    verified: "تصدیق شدہ",
    editListing: "لسٹنگ میں ترمیم",
    addToCompare: "موازنہ",
    inCompare: "موازنے میں",
    recentlyViewed: "حال ہی میں دیکھی گئی",
    emiCalculator: "قسط (EMI) کیلکولیٹر",
    areaConverter: "مرلہ / کنال / مربع فٹ کنورٹر",

    whatToDo: "آپ کیا کرنا چاہتے ہیں؟",
    propertyKind: "آپ کی جائیداد کس قسم کی ہے؟",
    title: "جائیداد کا عنوان",
    address: "پتہ، بلاک، گلی...",
    size: "رقبہ",
    price: "قیمت (روپے)",
    bedrooms: "بیڈروم",
    bathrooms: "باتھ روم",
    describe: "اپنی جائیداد کے بارے میں بتائیں",
    photos: "تصاویر",
    yourName: "آپ کا نام",
    phone: "فون نمبر",
    email: "ای میل",
    message: "پیغام",
    publish: "جائیداد شائع کریں",
    saveChanges: "تبدیلیاں محفوظ کریں",
    uploading: "اپ لوڈ ہو رہا ہے...",
    pinOnMap: "نقشے پر مقام لگائیں (اختیاری)",

    myListings: "میری لسٹنگز",
    enquiries: "پیغامات",
    alerts: "الرٹس",
    markSold: "فروخت شدہ",
    markAvailable: "دستیاب",
    delete: "حذف کریں",
    edit: "ترمیم",
    live: "لائیو",
    hidden: "چھپی ہوئی",
  },
};

const LanguageContext = createContext(null);

const savedLanguage = () => {
  try {
    return localStorage.getItem("language") === "ur" ? "ur" : "en";
  } catch {
    return "en";
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(savedLanguage);

  // Urdu is written right-to-left
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    try {
      localStorage.setItem("language", lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const t = (key) => translations[lang][key] ?? translations.en[key] ?? key;
  const toggleLanguage = () => setLang(lang === "en" ? "ur" : "en");

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
