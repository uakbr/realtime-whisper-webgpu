import { checkBrowserSupport } from "../utils/errorHandler";

export function BrowserCheck() {
  const { supported, missingFeatures } = checkBrowserSupport();
  
  if (!supported) {
    return (
      <div className="fixed w-screen h-screen bg-black z-10 bg-opacity-[92%] text-white text-xl sm:text-2xl font-semibold flex flex-col justify-center items-center text-center p-4">
        <h2 className="text-2xl sm:text-3xl mb-4">Browser Compatibility Issue</h2>
        
        {missingFeatures.includes('webGPU') && (
          <div className="mb-6">
            <p className="max-w-md mb-4 text-base sm:text-lg">
              This application requires WebGPU, which isn't available in your current browser.
            </p>
            <div className="text-base sm:text-lg">
              <p className="mb-2">Try one of these browsers:</p>
              <ul className="list-disc text-left ml-8">
                <li>Chrome (version 113+)</li>
                <li>Edge (version 113+)</li>
                <li>Firefox (version 118+ with flags enabled)</li>
              </ul>
            </div>
          </div>
        )}
        
        {!missingFeatures.includes('webGPU') && (
          <div className="mb-6">
            <p className="max-w-md mb-4 text-base sm:text-lg">
              This application requires features that aren't available in your current browser.
            </p>
            <div className="text-base sm:text-lg">
              <p className="mb-2">Missing features:</p>
              <ul className="list-disc text-left ml-8">
                {missingFeatures.map(feature => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-base sm:text-lg">
          <p>Please try using a modern browser with all required features enabled.</p>
        </div>
      </div>
    );
  }
  
  return null;
}
