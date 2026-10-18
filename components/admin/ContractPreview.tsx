"use client";

import { useEffect, useRef, useState } from "react";
import { CONTRACT_ICON_PATHS } from "@/lib/contract-icons";
import { formatContractDate, getContractSections, type ContractData, type ContractSection } from "@/lib/contracts";
import styles from "./ContractPreview.module.css";

function Party({ title, name, cin, address, phone }: { title: string; name: string; cin: string; address: string; phone: string }) {
  const compact = name.length > 45 || address.length > 75;
  const fields = [
    { label: "الاسم واللقب", value: name, width: 91 },
    { label: "رقم بطاقة التعريف الوطنية", value: cin, width: 170 },
    { label: "العنوان", value: address, width: 53 },
    { label: "الهاتف", value: phone, width: 53 },
  ];
  return (
    <div className={styles.party}>
      <h3>{title}</h3>
      {fields.map(({ label, value, width }) => (
        <p key={label} style={compact ? { fontSize: 11.5, lineHeight: 1.25 } : undefined}><strong style={{ width }}>{label}:</strong><bdi>{value || "........................"}</bdi></p>
      ))}
    </div>
  );
}

function Section({ section }: { section: ContractSection }) {
  return (
    <section className={styles.section}>
      <h3>
        <span className={styles.icon}>
          <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {CONTRACT_ICON_PATHS[section.icon].map((d, index) => <path key={index} d={d} />)}
          </svg>
        </span>
        <span className={styles.number}>{section.number}</span>
        <span>{section.title}</span>
      </h3>
      {section.lines.map((line, index) => (
        <p key={index} className={line.bold ? styles.bold : undefined}>{line.bullet && "• "}{line.text}</p>
      ))}
    </section>
  );
}

export function ContractPreview({ data, dossierNum }: { data: ContractData; dossierNum: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  const sections = getContractSections(data);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 906)));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={styles.viewport} dir="ltr">
      <div style={{ height: 1280 * scale, width: 906 * scale }} className={styles.scaledPage}>
        <article lang="ar" dir="rtl" aria-label="معاينة عقد الكراء" className={styles.sheet} style={{ transform: `scale(${scale})` }}>
          <header className={styles.title}><h2>عقد كراء واستغلال فضاء</h2><p dir="ltr">Les Jumelles</p></header>
          <p className={styles.intro}>بين أسفله،<br />تم إبرام هذا العقد بتاريخ: <bdi>{formatContractDate(data.contractDate)}</bdi> بين كل من:</p>
          <div className={styles.parties}>
            <Party title="المالك (قاعة Les Jumelles)" name={data.ownerName} cin={data.ownerCin} address={data.ownerAddress} phone={data.ownerPhone} />
            <Party title="المكتري" name={data.renterName} cin={data.renterCin} address={data.renterAddress} phone={data.renterPhone} />
          </div>
          <p className={styles.agreement}>وبعد أن تم الاتفاق بين الطرفين على ما يلي:</p>
          <div className={styles.rule} />
          <div className={styles.columns} dir="ltr">
            <div dir="rtl">{sections.slice(0, 5).map((section) => <Section key={section.number} section={section} />)}</div>
            <div dir="rtl">{sections.slice(5).map((section) => <Section key={section.number} section={section} />)}</div>
          </div>
          <p className={styles.copies}>حرر هذا العقد في نسختين أصليتين، لكل طرف نسخة.</p>
          <div className={styles.signatures} dir="ltr">
            <div dir="rtl"><strong>توقيع المكتري</strong><span /></div>
            <div dir="rtl"><strong>توقيع المالك</strong><bdi>(Les Jumelles)</bdi><span /></div>
          </div>
          <div className={styles.ornament} aria-hidden="true">~ ❖ ~</div>
          <p className={styles.thanks} dir="ltr">Merci de votre confiance</p>
          <p className={styles.reference} dir="ltr">{dossierNum}</p>
        </article>
      </div>
    </div>
  );
}
