import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { PLACEHOLDER_IMAGE } from "../utils/format";

// Big photo + thumbnails. Clicking the big photo opens a full-screen viewer
// with next / previous (also with the arrow keys).
export default function ImageGallery({ images = [], title = "" }) {
  const photos = images.length ? images : [PLACEHOLDER_IMAGE];
  const [current, setCurrent] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);

  const showNext = () => setCurrent((i) => (i + 1) % photos.length);
  const showPrevious = () => setCurrent((i) => (i - 1 + photos.length) % photos.length);

  useEffect(() => {
    if (!fullScreen) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") setCurrent((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setCurrent((i) => (i - 1 + photos.length) % photos.length);
      if (e.key === "Escape") setFullScreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullScreen, photos.length]);

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow";

  return (
    <div>
      {/* Main photo */}
      <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-lg bg-gray-200">
        <button type="button" className="w-full h-full" onClick={() => setFullScreen(true)}>
          <img
            src={photos[current]}
            alt={`${title} photo ${current + 1}`}
            className="w-full h-full object-cover"
          />
        </button>
        {photos.length > 1 && (
          <>
            <button type="button" onClick={showPrevious} className={`${arrowClass} left-3`} aria-label="Previous photo">
              <FaChevronLeft />
            </button>
            <button type="button" onClick={showNext} className={`${arrowClass} right-3`} aria-label="Next photo">
              <FaChevronRight />
            </button>
            <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              {current + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-3 mt-3 overflow-x-auto">
          {photos.map((photo, index) => (
            <button
              type="button"
              key={photo}
              onClick={() => setCurrent(index)}
              className={`h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden border-4 ${
                index === current ? "border-red-500" : "border-transparent"
              }`}
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Full-screen viewer */}
      {fullScreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setFullScreen(false)}>
          <img
            src={photos[current]}
            alt={`${title} photo ${current + 1}`}
            className="max-h-[90vh] max-w-[95vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={() => setFullScreen(false)}
            aria-label="Close"
          >
            <FaTimes />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrevious();
                }}
                className={`${arrowClass} left-4`}
                aria-label="Previous photo"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                className={`${arrowClass} right-4`}
                aria-label="Next photo"
              >
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
