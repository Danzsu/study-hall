/* Mascot component — renders the appropriate mascot PNG.
   Variants: "reading" (default), "whiteboard" (teacher), "clipboard", "wave", "plain"
*/
function Mascot({ variant="reading", size=120, style={} }){
  const enabled = window.__studyhall_tweaks?.mascot !== false;
  if(!enabled) return null;
  const src = {
    reading: "assets/mascot-reading.png",
    whiteboard: "assets/mascot-whiteboard.png",
    clipboard: "assets/mascot-clipboard.png",
    wave: "assets/mascot-wave.png",
    plain: "assets/mascot-plain.png",
  }[variant] || "assets/mascot-reading.png";
  return <img src={src} alt="" style={{width:size, height:"auto", objectFit:"contain", ...style}}/>;
}

window.Mascot = Mascot;
