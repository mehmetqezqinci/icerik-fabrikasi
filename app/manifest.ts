import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{
 return {name:"Dilara Ceylan İçerik Fabrikası",short_name:"İçerik Fabrikası",description:"Sohbet, dağıtım ve viral içerik üretim sistemi.",start_url:"/",display:"standalone",background_color:"#101010",theme_color:"#101010",orientation:"portrait",icons:[{src:"/icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any maskable"}]};
}
