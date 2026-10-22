import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISSED_KEY = "aaon:installPromptDismissed";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Chrome/Edge/Android fire `beforeinstallprompt` when the PWA is installable; we stash
 *  it and show our own banner instead of the browser's default mini-infobar, so the
 *  prompt matches the app's design and can be dismissed for good. */
export default function InstallPrompt() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (localStorage.getItem(DISMISSED_KEY)) return;
        // Already running as an installed app — nothing to prompt.
        if (window.matchMedia("(display-mode: standalone)").matches) return;

        const onPrompt = (e: Event) => {
            e.preventDefault();
            setDeferred(e as BeforeInstallPromptEvent);
            setVisible(true);
        };
        window.addEventListener("beforeinstallprompt", onPrompt);
        return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    }, []);

    const dismiss = () => {
        setVisible(false);
        localStorage.setItem(DISMISSED_KEY, "1");
    };

    const install = async () => {
        if (!deferred) return;
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:p-6">
            <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-forest-100 bg-white p-4 shadow-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-600 text-gold-400">
                    <Download size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-forest-900">Install AAON</p>
                    <p className="text-xs text-forest-700/70">Add this to your home screen for quick, full-screen access.</p>
                </div>
                <button
                    onClick={install}
                    className="shrink-0 rounded-lg bg-forest-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-forest-700"
                >
                    Install
                </button>
                <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-forest-700/50 hover:text-forest-700">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}