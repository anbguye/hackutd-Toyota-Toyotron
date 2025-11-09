type FinancingOption = {
  term: number
  payment: number
  total: number
  rate: number
}

type TotalMonthlySnapshotProps = {
  financing: FinancingOption[]
  insuranceMonthly: number
  maintenanceReserve: number
  msrp: number
  selectedTerm: number
}

type OwnershipRowProps = {
  label: string
  value: string
  accent?: boolean
}

function OwnershipRow({ label, value, accent }: OwnershipRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={accent ? "font-semibold text-secondary" : "text-muted-foreground"}>{label}</span>
      <span className={accent ? "text-lg font-bold text-primary" : "font-semibold text-secondary"}>{value}</span>
    </div>
  )
}

export function TotalMonthlySnapshot({
  financing,
  insuranceMonthly,
  maintenanceReserve,
  msrp,
  selectedTerm,
}: TotalMonthlySnapshotProps) {
  const selectedFinancing = financing.find((f) => f.term === selectedTerm) || financing[0]
  const totalMonthly = selectedFinancing.payment + insuranceMonthly + maintenanceReserve

  return (
    <div className="rounded-3xl border border-primary/50 bg-primary/5 p-8">
      <h3 className="text-lg font-semibold text-secondary">Total Monthly Snapshot</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Toyotron combines payment + protection so you know the real cost before stepping into the dealership.
      </p>

      {/* Monthly Costs Breakdown */}
      <div className="mt-6 space-y-4">
        <OwnershipRow
          label="Car payment"
          value={`$${selectedFinancing.payment.toLocaleString()}/mo`}
        />
        <OwnershipRow
          label="Insurance"
          value={`$${insuranceMonthly.toLocaleString()}/mo`}
        />
        <OwnershipRow
          label="Maintenance reserve"
          value={`$${maintenanceReserve.toLocaleString()}/mo`}
        />
        <div className="h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
        <OwnershipRow
          label="Total"
          value={`$${totalMonthly.toLocaleString()}/mo`}
          accent
        />
      </div>
    </div>
  )
}
