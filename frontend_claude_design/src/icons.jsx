/* Lucide icon wrapper. Usage: <Icon name="arrow-left" size={16}/> */
function Icon({ name, size=16, color="currentColor", style={}, strokeWidth=2, ...rest }){
  const ref = React.useRef(null);
  React.useEffect(()=>{
    if(!ref.current) return;
    const el = ref.current;
    el.innerHTML = "";
    try{
      const icons = window.lucide && window.lucide.icons;
      if(icons){
        // lucide names are kebab-case; their createIcons uses icon map keyed by PascalCase via icon objects
        // Using window.lucide.createElement: look up by name in icons map using kebab-case keys they expose
        const key = Object.keys(icons).find(k => k === name || k.toLowerCase() === name.toLowerCase());
        if(key){
          const svgStr = window.lucide.createElement(icons[key]).outerHTML;
          el.innerHTML = svgStr;
          const svg = el.firstChild;
          if(svg){
            svg.setAttribute("width", size);
            svg.setAttribute("height", size);
            svg.setAttribute("stroke", color);
            svg.setAttribute("stroke-width", strokeWidth);
          }
        }
      }
    }catch(e){}
  }, [name, size, color, strokeWidth]);
  return <span ref={ref} style={{display:"inline-flex", alignItems:"center", lineHeight:0, ...style}} {...rest}/>;
}
window.Icon = Icon;
