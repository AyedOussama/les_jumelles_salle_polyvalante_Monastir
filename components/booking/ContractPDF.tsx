import path from "node:path";
import { Document, Font, Image, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { CONTRACT_ICON_PATHS } from "@/lib/contract-icons";
import {
  formatContractDate,
  getContractSections,
  type ContractData,
  type ContractSection,
} from "@/lib/contracts";

Font.register({
  family: "ContractArabic",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Tajawal-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/Tajawal-Bold.ttf"), fontWeight: 700 },
  ],
});

const NAVY = "#10344d";
const GOLD = "#bc9946";
const styles = StyleSheet.create({
  page: { minHeight: 841.89, fontFamily: "ContractArabic", fontSize: 9, color: NAVY, backgroundColor: "#faf6e8" },
  artwork: { position: "absolute", top: 0, left: 0, width: 595.28, height: 841.89 },
  title: {
    position: "absolute", top: 133, left: 130, right: 130, height: 65,
    borderRadius: 28, borderWidth: 2, borderColor: GOLD, backgroundColor: NAVY,
    alignItems: "center", justifyContent: "center",
  },
  arabicTitle: { fontWeight: 700, fontSize: 24, color: "#fffdf3", direction: "rtl", textAlign: "center" },
  frenchTitle: { fontFamily: "Times-Bold", fontSize: 26, color: "#edd27c", marginTop: -2 },
  intro: { position: "absolute", top: 201, left: 29, right: 29, fontSize: 10.4, textAlign: "right", direction: "rtl", lineHeight: 1.35 },
  parties: { position: "absolute", top: 228, left: 29, right: 29, flexDirection: "row", gap: 10 },
  party: { width: "50%", minHeight: 88, borderWidth: 0.8, borderColor: GOLD, borderRadius: 5, paddingHorizontal: 8, paddingTop: 22, paddingBottom: 6 },
  partyTitle: {
    position: "absolute", top: -1, left: 32, right: 32, height: 20, borderRadius: 12,
    backgroundColor: NAVY, color: "#fffdf4", textAlign: "center", fontWeight: 700,
    fontSize: 10, paddingTop: 4, direction: "rtl",
  },
  partyRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 1 },
  partyLine: { textAlign: "right", direction: "rtl", fontSize: 8.7, lineHeight: 1.38 },
  bold: { fontWeight: 700 },
  agreement: { position: "absolute", top: 323, left: 29, right: 29, textAlign: "right", direction: "rtl", fontWeight: 700, fontSize: 10.6 },
  columns: { position: "absolute", top: 342, left: 29, right: 29, flexDirection: "row", gap: 14 },
  column: { width: "50%" },
  columnRule: { position: "absolute", top: 342, bottom: 119, left: 297, width: 0.7, backgroundColor: GOLD },
  section: { marginBottom: 6 },
  sectionHeading: { flexDirection: "row", alignItems: "center", backgroundColor: NAVY, borderRadius: 12, height: 19, marginBottom: 4, paddingLeft: 9, paddingRight: 2 },
  sectionTitle: { flex: 1, fontSize: 10.2, fontWeight: 700, color: "#fffdf4", textAlign: "right", direction: "rtl" },
  sectionNumber: { color: "#f0d479", fontSize: 14, fontWeight: 700, width: 21, textAlign: "center" },
  iconCircle: { width: 24, height: 24, backgroundColor: NAVY, borderWidth: 0.8, borderColor: GOLD, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionLine: { textAlign: "right", direction: "rtl", fontSize: 9, lineHeight: 1.28, marginBottom: 1, paddingHorizontal: 4 },
  signatures: { position: "absolute", top: 741, left: 111, right: 93, flexDirection: "row", justifyContent: "space-between" },
  signature: { width: 144, height: 47, borderWidth: 0.8, borderColor: GOLD, borderRadius: 5, paddingTop: 5 },
  signatureTitle: { textAlign: "center", direction: "rtl", fontWeight: 700, fontSize: 10.2 },
  signatureBrand: { textAlign: "center", fontSize: 9, fontWeight: 700 },
  signatureLine: { position: "absolute", left: 15, right: 15, bottom: 8, borderBottomWidth: 0.6, borderBottomColor: GOLD, borderStyle: "dotted" },
  copies: { position: "absolute", top: 723, left: 29, right: 29, textAlign: "center", direction: "rtl", fontSize: 9 },
  thanks: { position: "absolute", top: 793, left: 29, right: 29, textAlign: "center", color: GOLD, fontSize: 16, fontFamily: "Times-Italic" },
  reference: { position: "absolute", top: 818, left: 29, right: 29, textAlign: "center", color: NAVY, fontSize: 6.5 },
});

function Party({ title, name, cin, address, phone }: { title: string; name: string; cin: string; address: string; phone: string }) {
  const compact = name.length > 45 || address.length > 75;
  const lineStyle = compact ? [styles.partyLine, { fontSize: 7.6, lineHeight: 1.25 }] : [styles.partyLine];
  const fields = [
    { label: "الاسم واللقب", value: name, width: 60, latin: !/[\u0600-\u06ff]/.test(name) },
    { label: "رقم بطاقة التعريف الوطنية", value: cin, width: 112, latin: true },
    { label: "العنوان", value: address, width: 35, latin: !/[\u0600-\u06ff]/.test(address) },
    { label: "الهاتف", value: phone, width: 35, latin: true },
  ];
  return (
    <View style={styles.party}>
      <Text style={styles.partyTitle}>{title}</Text>
      {fields.map(({ label, value, width, latin }) => (
        <View key={label} style={styles.partyRow}>
          <Text style={[...lineStyle, { flex: 1, direction: latin ? "ltr" : "rtl" }]}>{value}</Text>
          <Text style={[...lineStyle, { width, fontWeight: 700 }]}>{label}:</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ section }: { section: ContractSection }) {
  return (
    <View style={styles.section} wrap={false}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionNumber}>{section.number}</Text>
        <View style={styles.iconCircle}>
          <Svg width={15} height={15} viewBox="0 0 24 24">
            {CONTRACT_ICON_PATHS[section.icon].map((d, index) => <Path key={index} d={d} stroke="#edd27c" strokeWidth={1.5} fill="none" />)}
          </Svg>
        </View>
      </View>
      {section.lines.map((line, index) => (
        <Text key={index} style={line.bold ? [styles.sectionLine, styles.bold] : styles.sectionLine}>
          {`${line.bullet ? "• " : ""}${line.text}`}
        </Text>
      ))}
    </View>
  );
}

export function ContractPDF({ data, dossierNum, artworkSrc }: { data: ContractData; dossierNum: string; artworkSrc: string }) {
  const sections = getContractSections(data);
  return (
    <Document title={`Contrat Les Jumelles - ${dossierNum}`} author="Les Jumelles Monastir" subject="عقد كراء واستغلال فضاء" language="ar-TN">
      <Page size="A4" style={styles.page} wrap={false}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={artworkSrc} style={styles.artwork} />
        <View style={styles.title}>
          <Text style={styles.arabicTitle}>عقد كراء واستغلال فضاء</Text>
          <Text style={styles.frenchTitle}>Les Jumelles</Text>
        </View>
        <Text style={styles.intro}>
          {`بين أسفله،\nتم إبرام هذا العقد بتاريخ: ${formatContractDate(data.contractDate)} بين كل من:`}
        </Text>
        <View style={styles.parties}>
          <Party title="المكتري" name={data.renterName} cin={data.renterCin} address={data.renterAddress} phone={data.renterPhone} />
          <Party title="المالك (قاعة Les Jumelles)" name={data.ownerName} cin={data.ownerCin} address={data.ownerAddress} phone={data.ownerPhone} />
        </View>
        <Text style={styles.agreement}>وبعد أن تم الاتفاق بين الطرفين على ما يلي:</Text>
        <View style={styles.columnRule} />
        <View style={styles.columns}>
          <View style={styles.column}>{sections.slice(0, 5).map((section) => <Section key={section.number} section={section} />)}</View>
          <View style={styles.column}>{sections.slice(5).map((section) => <Section key={section.number} section={section} />)}</View>
        </View>
        <Text style={styles.copies}>حرر هذا العقد في نسختين أصليتين، لكل طرف نسخة.</Text>
        <View style={styles.signatures}>
          <View style={styles.signature}>
            <Text style={styles.signatureTitle}>توقيع المكتري</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signature}>
            <Text style={styles.signatureTitle}>توقيع المالك</Text>
            <Text style={styles.signatureBrand}>(Les Jumelles)</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>
        <Svg style={{ position: "absolute", top: 776, left: 274 }} width={47} height={10} viewBox="0 0 47 10">
          <Path d="M0 6Q7 12 14 5M19 5l5-5 5 5-5 5ZM34 5Q41 12 47 6" fill="none" stroke={GOLD} strokeWidth={1} />
        </Svg>
        <Text style={styles.thanks}>Merci de votre confiance</Text>
        <Text style={styles.reference}>{dossierNum}</Text>
      </Page>
    </Document>
  );
}
