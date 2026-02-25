import React, { useEffect, useState } from "react";

const words = ["Student", "Learner", "Achiever", "Champion", "Aspirant"];

const Welcome: React.FC = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState(words[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentWord = words[wordIndex];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && text.length < currentWord.length) {
      // typing
      timeout = setTimeout(() => {
        setText(currentWord.slice(0, text.length + 1));
      }, 70);
    } else if (isDeleting && text.length > 0) {
      // deleting
      timeout = setTimeout(() => {
        setText(currentWord.slice(0, text.length - 1));
      }, 50);
    } else if (!isDeleting && text.length === currentWord.length) {
      // pause before delete
      timeout = setTimeout(() => setIsDeleting(true), 1200);
    } else if (isDeleting && text.length === 0) {
      // move to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, currentWord]);

  return (
    <div
      className="
        trezo-card
        mb-[25px]
        p-[12px] md:p-[20px]
        rounded-2xl
        relative
        overflow-hidden
        animate-welcome
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-2xl
        hover:brightness-110
        hover:ring-2 hover:ring-white/30
      "
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
      }}
    >
      {/* floating background */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-2xl animate-float-slower pointer-events-none" />

      <div className="relative z-10 sm:ltr:pr-[250px] sm:rtl:pl-[250px]">
        <h5 className="!mb-[6px] !font-bold !text-xl md:!text-2xl !text-white tracking-tight">
          Welcome back,&nbsp;
          <span className="inline-block min-w-[90px]">{text}</span>
          <span className="ml-1 text-2xl md:text-3xl animate-wave inline-block origin-[70%_70%]">
            👋
          </span>
        </h5>

        <p className="text-white/90 text-sm font-medium max-w-[500px] leading-relaxed">
          You're doing great! Keep up the excellent work on your JEE preparation.
        </p>

        <div className="md:mt-[15px] md:flex items-center gap-[15px]">
          <div className="mt-[15px] md:mt-0 flex items-center p-2 pr-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="w-[40px] h-[40px] mr-[10px] bg-white/20 text-white rounded-lg flex items-center justify-center">
              <i className="material-symbols-outlined text-[20px]">event</i>
            </div>
            <div>
              <span className="block font-bold text-white text-lg">135</span>
              <span className="block text-white/80 text-xs uppercase tracking-wide font-medium">
                Days Left (JEE 2025)
              </span>
            </div>
          </div>

          <div className="mt-[15px] md:mt-0 flex items-center p-2 pr-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="w-[40px] h-[40px] mr-[10px] bg-white/20 text-white rounded-lg flex items-center justify-center">
              <i className="material-symbols-outlined text-[20px]">
                schedule
              </i>
            </div>
            <div>
              <span className="block font-bold text-white text-lg">142h</span>
              <span className="block text-white/80 text-xs uppercase tracking-wide font-medium">
                Hours Spent
              </span>
            </div>
          </div>
        </div>

        <div className="sm:absolute sm:top-1/2 sm:-translate-y-1/2 sm:-right-[10px] sm:max-w-[170px] drop-shadow-2xl">
          <img
            src="/images/online-learning.gif"
            alt="online-learning"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Welcome;
