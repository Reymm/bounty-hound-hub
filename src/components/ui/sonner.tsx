import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = "system" // TODO: Implement proper theme provider if needed

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={4000}
      position="top-center"
      expand={false}
      richColors={true}
      closeButton={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:z-[9999] group-[.toaster]:pointer-events-auto group-[.toaster]:max-w-[calc(100vw-2rem)] group-[.toaster]:mx-auto group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:!right-2 group-[.toast]:!top-2",
        },
      }}
      style={{
        // Ensure toasts are above everything on mobile
        zIndex: 9999,
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
