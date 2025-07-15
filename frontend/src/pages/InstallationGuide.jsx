import { Link } from "react-router-dom";
import AppleIcon from "../icons/AppleIcon";
import AndroidIcon from "../icons/AndroidIcon";
import ShareIcon from "../icons/ShareIcon";
import AddToHomeScreenAppleIcon from "../icons/AddToHomeScreenAppleIcon";
import { VerticalDots } from "../icons/DotsIcon";

const InstallationGuide = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2 text-center">
          Installation Guide
        </h1>
        <h2 className="text-lg text-gray-700 mb-10 text-center">
          Steps below for iPhone and Android.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* iOS */}
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-2 mb-4">
              <AppleIcon />
              <span className="font-semibold text-lg text-blue-700">iOS</span>
            </div>
            <ul className="flex flex-col gap-3 w-full">
              <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
                <span className="font-bold text-blue-500">1</span>
                <span>
                  Tap <span className="font-semibold">Share</span>{" "}
                  <span className="inline-block align-middle">
                    <ShareIcon />
                  </span>{" "}
                  at the bottom of Safari
                </span>
              </li>
              <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
                <span className="font-bold text-blue-500">2</span>
                <span>
                  Select{" "}
                  <span className="font-semibold">Add to Home Screen </span>
                  <span className="inline-block align-middle">
                    <AddToHomeScreenAppleIcon />
                  </span>
                </span>
              </li>
              <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
                <span className="font-bold text-blue-500">3</span>
                <span>
                  Tap <span className="font-semibold">Add</span> in the
                  top-right corner
                </span>
              </li>
            </ul>
          </div>
          {/* Android */}
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-2 mb-4">
              <AndroidIcon />
              <span className="font-semibold text-lg text-blue-700">
                Android
              </span>
            </div>
            <ul className="flex flex-col gap-3 w-full">
              <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
                <span className="font-bold text-blue-500">1</span>
                <span>
                  Open <span className="font-semibold">Chrome</span> (or your
                  browser)
                </span>
              </li>
              <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
                <span className="font-bold text-blue-500">2</span>
                <span>
                  Tap <span className="font-semibold">Menu</span>{" "}
                  <span className="inline-block align-middle">
                    <VerticalDots color="text-blue-500" />
                  </span>{" "}
                  at the top-right
                </span>
              </li>
              <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
                <span className="font-bold text-blue-500">3</span>
                <span>
                  Select{" "}
                  <span className="font-semibold">Add to Home screen</span> or{" "}
                  <span className="font-semibold">Install app</span>
                </span>
              </li>
              <li className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm flex items-start gap-2 hover:bg-blue-50/50 transition">
                <span className="font-bold text-blue-500">4</span>
                <span>
                  Tap <span className="font-semibold">Add</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-3 text-center mt-8">
          You’ll now see FTracker on your home screen!
        </div>
        <div className="mt-12 flex flex-col items-center gap-2 w-full">
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
          <div className="text-gray-400 text-xs mt-3 text-center">
            Need help?{" "}
            <a
              href="mailto:dmitrii.lor@glasgow.ac.uk"
              className="underline hover:text-blue-500"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallationGuide;
