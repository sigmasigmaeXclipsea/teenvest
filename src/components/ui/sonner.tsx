import { Toaster as Sonner, toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // Safely get settings, default to light mode if not available
  let theme: "light" | "dark" = "light";
  try {
    const { settings } = useSettings();
    theme = settings.darkMode ? "dark" : "light";
  } catch {
    // If SettingsContext is not available, check document class
    theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
