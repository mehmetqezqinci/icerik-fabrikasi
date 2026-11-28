import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata:Metadata={
 title:"Dilara Ceylan | İçerik Fabrikası V6",
 description:"Dernek için sohbet, dağıtım ve viral içerik üretim sistemi.",
 applicationName:"Dilara İçerik Fabrikası",
 manifest:"/manifest.webmanifest",
 appleWebApp:{capable:true,title:"İçerik Fabrikası",statusBarStyle:"black-translucent"},
};
export const viewport:Viewport={themeColor:"#101010",width:"device-width",initialScale:1,maximumScale:1,userScalable:false};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="tr"><body>{children}</body></html>;
}
