// Certificate rendering and PDF export. Pure browser code, no library, no network.
// The PDF is one landscape page (A4 width, the template's own proportions) holding a 2x raster of the owner's template,
// so print and download look the same on every device.
export const CERT_W=1280,CERT_H=853,SCALE=2;

export function buildPdf(jpeg,pxW,pxH,pageH=595.28){
 // Minimal PDF 1.4: catalog, pages, page (A4 landscape in points), image XObject (DCT), content, info.
 const enc=s=>new TextEncoder().encode(s),parts=[],offs=[];let len=0;
 const push=b=>{const u=typeof b==='string'?enc(b):b;parts.push(u);len+=u.length};
 const obj=(n,body)=>{offs[n]=len;push(n+' 0 obj\n');push(body);push('\nendobj\n')};
 push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 '+pageH.toFixed(2)+'] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>');
 offs[4]=len;push('4 0 obj\n<< /Type /XObject /Subtype /Image /Width '+pxW+' /Height '+pxH+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');push(jpeg);push('\nendstream\nendobj\n');
 const content='q 841.89 0 0 '+pageH.toFixed(2)+' 0 0 cm /Im0 Do Q';
 obj(5,'<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream');
 obj(6,'<< /Title (CodeQuest certificate) /Producer (CodeQuest) >>');
 const xref=len;let x='xref\n0 7\n0000000000 65535 f \n';for(let i=1;i<=6;i++)x+=String(offs[i]).padStart(10,'0')+' 00000 n \n';
 push(x+'trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
 const out=new Uint8Array(len);let p=0;for(const u of parts){out.set(u,p);p+=u.length}return out;
}

export const fmtDate=d=>{const t=new Date(d);if(Number.isNaN(t.getTime()))return '';return String(t.getDate()).padStart(2,'0')+' / '+String(t.getMonth()+1).padStart(2,'0')+' / '+t.getFullYear()};
export const fmtTime=d=>{const t=new Date(d);if(Number.isNaN(t.getTime()))return '';return String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0')};
export const trackLabel=l=>({python:'Python',javascript:'JavaScript',cpp:'C++',java:'Java'}[l]||String(l||''));

// record: {name, language, issuedAt, certId?, demo?}
// The design is the owner's template image (certificate-template.jpg, 1280x853). Only the empty slots are filled with the server-verified
// record: learner name, track, issue date and time, and a small certificate number under the signature. Nothing else is drawn over the design.
const CODY_URL=new URL('./certificate-cody.png',import.meta.url).href;
const TPL_URL=new URL('./certificate-template.jpg',import.meta.url).href;
export async function drawCertificate(canvas,record,_unused){
 canvas.width=CERT_W*SCALE;canvas.height=CERT_H*SCALE;const c=canvas.getContext('2d');c.scale(SCALE,SCALE);
 const F='"Noto Sans Arabic","Segoe UI",Tahoma,Arial,sans-serif';
 try{await document.fonts.load('800 40px "Noto Sans Arabic"')}catch{}
 const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=TPL_URL});
 c.drawImage(img,0,0,CERT_W,CERT_H);
 // Cody with the scroll, in the empty cream area on the left. If the image fails to load the certificate is still complete.
 try{const cody=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=CODY_URL});const ch=252,cw=ch*cody.naturalWidth/cody.naturalHeight;c.drawImage(cody,92,438,cw,ch)}catch{}
 const ink='#0b1a3a',fit=(txt,font,max)=>{c.font=font;let t=txt;while(t.length>1&&c.measureText(t).width>max)t=t.slice(0,-1);return t};
 c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle=ink;
 // learner name: the open space between "تشهد منصة CodeQuest بأن" and the gold divider
 c.direction='rtl';{const nm=String(record.name||'');let px=60;c.font='800 '+px+'px '+F;while(px>34&&c.measureText(nm).width>800){px-=2;c.font='800 '+px+'px '+F}const shown=fit(nm,'800 '+px+'px '+F,780);c.fillText(shown.length<nm.length?shown.trimEnd()+'…':shown,640,398)}
 // track name inside the pill after "مسار:"
 c.direction='ltr';c.font='800 36px '+F;c.fillText(fit(trackLabel(record.language),'800 36px '+F,360),640,540);
 // issue date and time in their slots
 c.direction='ltr';c.fillText(fit(fmtDate(record.issuedAt)||'--','700 21px '+F,138),654,606);
 c.fillText(fit(fmtTime(record.issuedAt)||'--:--','700 23px '+F,112),413,606);
 // certificate number, small, under the signature line (cream area, nothing of the design is covered)
 c.fillStyle='#46536f';c.direction='rtl';c.font='400 15px '+F;
 c.fillText(record.certId?'رقم الشهادة:':'رقم الشهادة: غير صادر',212,780);
 if(record.certId){c.direction='ltr';c.font='400 13px '+F;c.fillText(String(record.certId),212,798)}
 if(record.demo||record.synthetic){c.save();c.translate(640,500);c.rotate(-0.28);c.globalAlpha=.16;c.fillStyle='#a42828';c.textAlign='center';c.direction='rtl';c.font='800 96px '+F;c.fillText('نموذج تجريبي',0,0);c.font='800 52px '+F;c.fillText('غير صادر وليس شهادة',0,70);c.restore();
  c.fillStyle='#fff';c.fillRect(24,24,230,28);c.strokeStyle='#a42828';c.lineWidth=1.5;c.strokeRect(24,24,230,28);c.fillStyle='#a42828';c.font='700 13px '+F;c.textAlign='center';c.direction='rtl';c.fillText('نموذج تصميم فقط، غير صادر',139,43)}
}

export async function certificatePdfBytes(record,codyUrl){
 const cv=document.createElement('canvas');await drawCertificate(cv,record,codyUrl);
 const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.92));const jpeg=new Uint8Array(await blob.arrayBuffer());
 return buildPdf(jpeg,cv.width,cv.height,841.89*cv.height/cv.width);
}
