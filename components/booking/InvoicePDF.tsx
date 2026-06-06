import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SITE_CONFIG } from '@/lib/constants';
import type { SystemSettings } from '@/app/actions/settings';
import {
  hydrateExtrasFromOptionLabels,
  normalizeOptionLabel,
  splitBookingSpecialNeeds,
} from '@/lib/bookingOptions';


const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function formatPdfMoney(value?: number) {
  const amount = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
  const [integerPart, decimalPart] = (Number.isInteger(amount) ? String(amount) : amount.toFixed(2)).split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return `${decimalPart ? `${groupedInteger},${decimalPart}` : groupedInteger} TND`;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#334155',
    backgroundColor: '#FFFFFF',
  },
  headerBanner: {
    backgroundColor: '#1A242B',
    height: 15,
    marginHorizontal: -40,
    marginTop: -40,
    marginBottom: 5,
  },
  headerStrip: {
    backgroundColor: '#C5A880',
    height: 2,
    marginHorizontal: -40,
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 140,
    height: 120,
    objectFit: 'contain',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F3C68', // Deep blue matching the logo text
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9B5A7C', // Gold/Burgundy dusty rose matching logo gradient
    letterSpacing: 2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  cityTitle: {
    fontSize: 8,
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    marginVertical: 12,
  },
  dossierInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dossierTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A242B',
    textTransform: 'uppercase',
  },
  dossierNum: {
    fontSize: 12,
    color: '#C5A880',
    fontWeight: 'bold',
  },
  metaText: {
    color: '#64748B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
    padding: 8,
  },
  gridCol: {
    width: '50%',
    padding: 4,
  },
  gridLabel: {
    fontWeight: 'bold',
    color: '#1A242B',
    marginBottom: 2,
  },
  gridValue: {
    color: '#475569',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A242B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Table styling
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A242B',
    minHeight: 24,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    minHeight: 22,
    alignItems: 'center',
  },
  tableColHeaderLabel: {
    width: '75%',
    color: '#FFFFFF',
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  tableColHeaderValue: {
    width: '25%',
    color: '#FFFFFF',
    fontWeight: 'bold',
    paddingRight: 10,
    textAlign: 'right',
  },
  tableColLabel: {
    width: '75%',
    paddingLeft: 10,
  },
  tableColValue: {
    width: '25%',
    paddingRight: 10,
    textAlign: 'right',
    color: '#475569',
  },
  financialSummaryBox: {
    marginLeft: 'auto',
    width: '45%',
    marginTop: 5,
    marginBottom: 15,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  financialTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    backgroundColor: '#FAF6F0',
    borderTopWidth: 1,
    borderTopColor: '#C5A880',
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1A242B',
  },
  goldBoldText: {
    fontWeight: 'bold',
    color: '#C5A880',
  },
  notesBox: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    marginBottom: 15,
  },
  notesTitle: {
    fontWeight: 'bold',
    color: '#1A242B',
    marginBottom: 2,
  },
  notesText: {
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 1.2,
  },
  clauseText: {
    color: '#94A3B8',
    fontSize: 7,
    fontStyle: 'italic',
    lineHeight: 1.2,
    marginBottom: 20,
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  signatureBlock: {
    width: '40%',
    alignItems: 'center',
  },
  signatureLine: {
    marginTop: 35,
    borderBottomWidth: 0.5,
    borderBottomColor: '#94A3B8',
    width: '100%',
    marginBottom: 4,
  },
  signatureTitle: {
    fontWeight: 'bold',
    color: '#1A242B',
  },
  signatureSubtitle: {
    fontSize: 7,
    color: '#94A3B8',
  },
  footerText: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 7,
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  }
});

interface InvoiceBooking {
  dossierNum: string;
  date: number;
  month?: number;
  year?: number;
  slot: "matinee" | "soiree";
  name: string;
  phone: string;
  eventType: string;
  specialNeeds?: string;
  extras?: Record<string, boolean>;
  totalPrice?: number;
  advancePayment?: number;
  remainingAmount?: number;
}

interface InvoicePDFProps {
  booking: InvoiceBooking;
  settings?: SystemSettings | null;
  logoSrc?: string;
}

export function InvoicePDF({ booking, settings, logoSrc }: InvoicePDFProps) {
  const logoUrl = logoSrc || (typeof window !== 'undefined' ? `${window.location.origin}/logo_complet.png` : '/logo_complet.png');
  const bookingMonth = booking.month !== undefined ? MONTH_NAMES_FR[booking.month] : "Mai";
  const bookingYear = booking.year !== undefined ? booking.year : 2026;
  const { clientNotes, optionLabels } = splitBookingSpecialNeeds(booking.specialNeeds);

  const defaultExtrasNames: Record<string, string> = {
    decoration: "Décoration Florale & Trône Premium",
    sonorisation: "Sonorisation Haute Fidélité & DJ",
    climatisation: "Système de Climatisation Renforcé",
    traiteur: "Menu de Fêtes & Service Traiteur",
    autres: "Autres aménagements spécifiques"
  };

  const extraLabels = settings?.extras
    ? Object.fromEntries(Object.entries(settings.extras).map(([key, extra]) => [key, extra.label]))
    : defaultExtrasNames;
  const hydratedExtras = hydrateExtrasFromOptionLabels(booking.extras, settings?.extras, optionLabels);
  const selectedExtraKeys = Object.entries(hydratedExtras)
    .filter(([, selected]) => selected)
    .map(([key]) => key);
  const selectedExtraLabels = new Set(
    selectedExtraKeys.map((key) => normalizeOptionLabel(extraLabels[key] || key)),
  );
  const extrasList = Array.from(new Set([...Object.keys(extraLabels), ...selectedExtraKeys])).map((key) => ({
    label: extraLabels[key] || key,
    selected: !!hydratedExtras[key]
  })).concat(
    optionLabels
      .filter((label) => !selectedExtraLabels.has(normalizeOptionLabel(label)))
      .map((label) => ({ label, selected: true })),
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Ribbon banners */}
        <View style={styles.headerBanner} />
        <View style={styles.headerStrip} />

        {/* Corporate branding */}
        <View style={styles.titleContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoUrl} style={styles.logo} />
        </View>

        <View style={styles.divider} />

        {/* Document meta description */}
        <View style={styles.dossierInfoRow}>
          <View>
            <Text style={styles.dossierTitle}>DEVIS & CONTRAT DE RÉSERVATION</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.metaText}>Dossier N° : </Text>
            <Text style={styles.dossierNum}>{booking.dossierNum}</Text>
          </View>
        </View>

        {/* Info grid */}
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Client :</Text>
            <Text style={styles.gridValue}>{booking.name}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Date de l&apos;événement :</Text>
            <Text style={styles.gridValue}>{booking.date} {bookingMonth} {bookingYear}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Téléphone :</Text>
            <Text style={styles.gridValue}>{booking.phone}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Créneau horaire :</Text>
            <Text style={styles.gridValue}>
              {booking.slot === "matinee" ? "Matinée (10h-16h)" : "Soirée (20h-00h)"}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Type de cérémonie :</Text>
            <Text style={styles.gridValue}>{booking.eventType}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Date de devis :</Text>
            <Text style={styles.gridValue}>{new Date().toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>

        {/* Extras Table */}
        <Text style={styles.sectionTitle}>Options & Prestations incluses</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={styles.tableColHeaderLabel}>Option Prestation</Text>
            <Text style={styles.tableColHeaderValue}>Sélection</Text>
          </View>
          {extrasList.map((extra, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.tableColLabel}>{extra.label}</Text>
              <Text style={styles.tableColValue}>{extra.selected ? "Oui" : "Non"}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Summary */}
        <View style={styles.financialSummaryBox}>
          <View style={styles.financialRow}>
            <Text style={{ color: '#64748B' }}>Prix Total Prestations :</Text>
            <Text style={styles.boldText}>{formatPdfMoney(booking.totalPrice)}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={{ color: '#64748B' }}>Montant Acompte Payé :</Text>
            <Text style={{ ...styles.boldText, color: '#10B981' }}>{formatPdfMoney(booking.advancePayment)}</Text>
          </View>
          <View style={styles.financialTotalRow}>
            <Text style={styles.boldText}>Solde restant dû :</Text>
            <Text style={styles.goldBoldText}>{formatPdfMoney(booking.remainingAmount)}</Text>
          </View>
        </View>

        {/* Special wishes */}
        {clientNotes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Demandes & Instructions particulières client :</Text>
            <Text style={styles.notesText}>{clientNotes}</Text>
          </View>
        ) : null}

        {/* Terms and conditions */}
        <Text style={styles.clauseText}>
          Ce devis prévaut pour la date réservée. La réservation n&apos;est définitive qu&apos;à la signature du contrat officiel et à la réception de l&apos;acompte convenu. En cas d&apos;annulation moins de 30 jours avant, l&apos;acompte ne sera pas remboursé.
        </Text>

        {/* Signature Blocks */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureTitle}>Signature Client</Text>
            <Text style={styles.signatureSubtitle}>(précédé de la mention &quot;Lu et approuvé&quot;)</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureTitle}>Le Gérant (Cachet & Signature)</Text>
            <Text style={styles.signatureSubtitle}>Pour la direction &quot;Les Jumelles&quot;</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Footer info banner */}
        <Text style={styles.footerText}>
          {SITE_CONFIG.address.invoice} - Tél: {SITE_CONFIG.phone.display}
        </Text>
      </Page>
    </Document>
  );
}
