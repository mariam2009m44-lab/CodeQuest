// Certificate rendering and PDF export. Pure browser code, no library, no network.
// The PDF is one A4 landscape page holding a 3x raster of the approved v5 design,
// so print and download look the same on every device.
export const CERT_W=1123,CERT_H=794,SCALE=3;

export function buildPdf(jpeg,pxW,pxH){
 // Minimal PDF 1.4: catalog, pages, page (A4 landscape in points), image XObject (DCT), content, info.
 const enc=s=>new TextEncoder().encode(s),parts=[],offs=[];let len=0;
 const push=b=>{const u=typeof b==='string'?enc(b):b;parts.push(u);len+=u.length};
 const obj=(n,body)=>{offs[n]=len;push(n+' 0 obj\n');push(body);push('\nendobj\n')};
 push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>');
 offs[4]=len;push('4 0 obj\n<< /Type /XObject /Subtype /Image /Width '+pxW+' /Height '+pxH+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');push(jpeg);push('\nendstream\nendobj\n');
 const content='q 841.89 0 0 595.28 0 0 cm /Im0 Do Q';
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
export async function drawCertificate(canvas,record,codyUrl){
 canvas.width=CERT_W*SCALE;canvas.height=CERT_H*SCALE;const c=canvas.getContext('2d');c.scale(SCALE,SCALE);c.direction='rtl';
 const F='"Noto Sans Arabic","Segoe UI",Tahoma,Arial,sans-serif';
 try{await document.fonts.load('800 40px "Noto Sans Arabic"')}catch{}
 c.fillStyle='#fdfbf5';c.fillRect(0,0,CERT_W,CERT_H);
 c.strokeStyle='#0b1a3a';c.lineWidth=4;c.strokeRect(22,22,CERT_W-44,CERT_H-44);
 c.strokeStyle='#b8923a';c.lineWidth=1.5;c.strokeRect(32.75,32.75,CERT_W-65.5,CERT_H-65.5);
 // navy panel on the right
 const px=CERT_W-32-300,py=32,pw=300,ph=CERT_H-64;
 const g=c.createRadialGradient(px+pw/2,py+ph*.38,0,px+pw/2,py+ph*.38,ph*.7);g.addColorStop(0,'#1b2f6b');g.addColorStop(1,'#0a1230');c.fillStyle=g;c.fillRect(px,py,pw,ph);
 c.textAlign='center';c.direction='ltr';c.fillStyle='#fff';c.font='800 30px '+F;c.fillText('CodeQuest',px+pw/2,py+62);
 c.fillStyle='#d9c07a';c.font='500 12px '+F;try{c.letterSpacing='3px'}catch{}c.fillText('LEARN · PLAY · GROW',px+pw/2,py+84);try{c.letterSpacing='0px'}catch{}
 c.direction='rtl';c.font='700 14px '+F;c.fillText('منصة تعلم البرمجة',px+pw/2,py+ph-30);
 const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=codyUrl});
 const iw=276,ih=iw*img.naturalHeight/img.naturalWidth,off=document.createElement('canvas');off.width=Math.round(iw*SCALE);off.height=Math.round(ih*SCALE);
 const o=off.getContext('2d');o.drawImage(img,0,0,off.width,off.height);o.globalCompositeOperation='destination-in';const m=o.createLinearGradient(0,0,0,off.height);m.addColorStop(0,'#000');m.addColorStop(.58,'#000');m.addColorStop(.88,'rgba(0,0,0,0)');o.fillStyle=m;o.fillRect(0,0,off.width,off.height);
 c.drawImage(off,px+6,py+168,iw,ih);
 // main column
 const cx=(62+(CERT_W-360))/2,ink='#0b1a3a',soft='#46536f',gold='#b8923a';c.textAlign='center';
 c.fillStyle='#8a6d22';c.direction='ltr';c.font='700 13px '+F;try{c.letterSpacing='4px'}catch{}c.fillText('CERTIFICATE OF COMPLETION',cx,84);try{c.letterSpacing='0px'}catch{}
 c.direction='rtl';c.fillStyle=ink;c.font='800 50px '+F;c.fillText('شهادة إتمام مسار',cx,146);
 c.strokeStyle=gold;c.lineWidth=1.5;c.beginPath();c.moveTo(cx-100,178);c.lineTo(cx-14,178);c.moveTo(cx+14,178);c.lineTo(cx+100,178);c.stroke();
 c.save();c.translate(cx,178);c.rotate(Math.PI/4);c.fillStyle=gold;c.fillRect(-4.5,-4.5,9,9);c.restore();
 c.fillStyle=soft;c.font='400 18px '+F;c.fillText('تشهد منصة CodeQuest بأن',cx,222);
 c.fillStyle=ink;c.font='800 46px '+F;let name=record.name||'';while(name&&c.measureText(name).width>560)name=name.slice(0,-1);c.fillText(name,cx,292);
 c.strokeStyle=gold;c.lineWidth=2;c.beginPath();c.moveTo(cx-280,308);c.lineTo(cx+280,308);c.stroke();
 c.fillStyle=soft;c.font='400 18px '+F;c.fillText('أتمّ جميع دروس المسار واجتاز اختبارات فصوله',cx,350);
 const w1='مسار',w2=trackLabel(record.language);c.font='800 28px '+F;const m1=c.measureText(w1).width,m2=c.measureText(w2).width,gap=16,tw=m1+m2+gap+64;
 c.fillStyle='#f3ecd8';c.fillRect(cx-tw/2,368,tw,50);c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(cx-tw/2,368,tw,50);c.fillStyle=ink;
 c.textAlign='right';c.fillText(w1,cx+tw/2-32,404);c.direction='ltr';c.textAlign='left';c.fillText(w2,cx-tw/2+32,404);c.direction='rtl';c.textAlign='center';
 c.fillStyle=soft;c.font='400 16px '+F;c.fillText('تاريخ الإصدار: '+(fmtDate(record.issuedAt)||'--')+'      الوقت: '+(fmtTime(record.issuedAt)||'--:--'),cx,462);
 // signature (bottom right of the main column) and verification id (bottom left)
 c.save();c.translate(cx+200,722);c.rotate(-3*Math.PI/180);c.direction='ltr';c.fillStyle=ink;c.font='italic 38px "DejaVu Serif",Georgia,serif';c.fillText('mariam Fouad',0,0);c.restore();
 c.strokeStyle=ink;c.lineWidth=1.5;c.beginPath();c.moveTo(cx+68,732);c.lineTo(cx+332,728);c.stroke();c.direction='rtl';c.fillStyle=soft;c.font='400 13px '+F;c.fillText('التوقيع',cx+200,750);
 c.textAlign='left';c.direction='rtl';c.font='400 13px '+F;c.fillStyle=soft;c.textAlign='center';
 c.fillText(record.certId?'رقم الشهادة: '+record.certId:'رقم الشهادة: غير صادر',cx-215,742);
 c.font='400 13px '+F;c.fillStyle='#6a7590';c.fillText('شهادة إتمام من منصة CodeQuest، وليست معتمدة من جهة خارجية.',cx,520);
 if(record.demo||record.synthetic){c.save();c.translate(cx,430);c.rotate(-0.38);c.globalAlpha=.16;c.fillStyle='#a42828';c.font='800 74px '+F;c.textAlign='center';c.fillText('نموذج تجريبي',0,0);c.font='800 44px '+F;c.fillText('غير صادر وليس شهادة حقيقية',0,62);c.restore();
  c.fillStyle='#fff';c.fillRect(46,44,190,24);c.strokeStyle='#a42828';c.lineWidth=1.5;c.strokeRect(46,44,190,24);c.fillStyle='#a42828';c.font='700 12px '+F;c.textAlign='center';c.fillText('نموذج تصميم فقط، غير صادر',141,61)}
 if(false){c.fillStyle='#fff';c.fillRect(46,44,150,24);c.strokeStyle='#a42828';c.lineWidth=1.5;c.strokeRect(46,44,150,24);c.fillStyle='#a42828';c.font='700 12px '+F;c.fillText('نموذج تصميم فقط، غير صادر',121,61)}
}

export async function certificatePdfBytes(record,codyUrl){
 const cv=document.createElement('canvas');await drawCertificate(cv,record,codyUrl);
 const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.92));const jpeg=new Uint8Array(await blob.arrayBuffer());
 return buildPdf(jpeg,cv.width,cv.height);
}
