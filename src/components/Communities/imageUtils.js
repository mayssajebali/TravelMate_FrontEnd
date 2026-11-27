// Redimensionne + compresse une image choisie sur l'ordinateur et la renvoie
// en data URL (JPEG), pour l'envoyer telle quelle au backend.
const MAX_SIDE = 1280 // px (plus grand côté)
const QUALITY = 0.8
const MAX_FILE_MB = 10

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier choisi n’est pas une image.'))
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      reject(new Error(`Image trop lourde (${MAX_FILE_MB} Mo maximum).`))
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff' // fond blanc pour les PNG transparents
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de lire cette image.'))
    }
    img.src = url
  })
}