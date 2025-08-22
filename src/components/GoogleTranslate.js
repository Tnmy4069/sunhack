"use client";
import { useEffect } from "react";

export default function GoogleTranslate() {
  useEffect(() => {
    const addScript = document.createElement("script");
    addScript.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };
  }, []);

  // Function to change language manually
  const changeLanguage = (lang) => {
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    }
  };

  return (
    <div>
      {/* Hidden original widget */}
      <div id="google_translate_element" style={{ display: "none" }}></div>

      {/* Custom dropdown */}
      <select
        className="p-2 rounded-lg border shadow bg-white"
        onChange={(e) => changeLanguage(e.target.value)}
      >
        <option value="">Select Language</option>
        <option value="hi">हिन्दी</option>
        <option value="mr">मराठी</option>
        <option value="bn">বাংলা</option>
        <option value="ta">தமிழ்</option>
        <option value="te">తెలుగు</option>
        <option value="kn">ಕನ್ನಡ</option>
        <option value="ml">മലയാളം</option>
        <option value="gu">ગુજરાતી</option>
        <option value="pa">ਪੰਜਾਬੀ</option>
        <option value="ur">اردو</option>
      </select>
    </div>
  );
}
