import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Save the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }

    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  const handleDismiss = () => {
    setShowInstallButton(false)
    // Remember dismissal for this session
    sessionStorage.setItem('install-prompt-dismissed', 'true')
  }

  // Don't show if already dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem('install-prompt-dismissed')) {
      setShowInstallButton(false)
    }
  }, [])

  if (!showInstallButton) return null

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <span className="install-prompt-text">
          📱 Install Don't Die as an app for quick access!
        </span>
        <div className="install-prompt-buttons">
          <button onClick={handleInstallClick} className="install-button">
            Install
          </button>
          <button onClick={handleDismiss} className="dismiss-button">
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
