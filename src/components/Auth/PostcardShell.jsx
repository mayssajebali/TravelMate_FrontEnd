import './Auth.css'
import './AccessGate.css'
import { Stickers } from './Auth'

export default function PostcardShell({
  mode = 'login',
  hand = 'Wish you were here !',
  text = 'Partage tes itinéraires, rejoins des groupes et trouve la personne avec qui partir.',
  stamp = '🌴',
  children,
}) {
  return (
    <div className="tm-scene" data-mode={mode}>
      <div className="tm-blob b1" /><div className="tm-blob b2" /><div className="tm-blob b3" />
      <Stickers />

      <main className="tm-card">
        <div className="tm-inner">
          <section className="tm-msg">
            <p className="tm-logo">travel<span>Mate</span></p>
            <div className="tm-stamp" aria-hidden="true">{stamp}</div>
            <div className="tm-postmark" aria-hidden="true">TRAVELMATE<br />★ AIR MAIL ★<br />2026</div>
            <div className="tm-hand">{hand}</div>
            <p className="tm-text">{text}</p>
            <div className="tm-lines" aria-hidden="true"><i /><i /><i /></div>
          </section>

          <section className="tm-form tm-flip">{children}</section>
        </div>
      </main>
    </div>
  )
}