import { useDependents } from '@/hooks/useDependents';
import brandLogo from '@/assets/ser-sadia-express-logo.png';

interface DependentsCardBackProps {
  memberId: string;
}

const relationshipLabels: Record<string, string> = {
  filho: 'Filho',
  filha: 'Filha',
  conjuge: 'Cônjuge',
};

export function DependentsCardBack({ memberId }: DependentsCardBackProps) {
  const { data: dependents = [] } = useDependents(memberId);

  return (
    <div className="w-[340px] min-h-[580px] bg-white rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 pt-5 pb-3 flex justify-center">
        <img src={brandLogo} alt="Ser Sadia Express" className="h-14 w-auto object-contain" />
      </div>

      <div className="h-px bg-border mx-4" />

      {/* Title */}
      <div className="text-center py-3">
        <p className="text-sm font-bold tracking-wide text-[hsl(0,0%,9%)]">DEPENDENTES</p>
      </div>

      <div className="h-px bg-border mx-4" />

      {/* Dependents list */}
      <div className="px-6 py-4 flex-1">
        {dependents.length === 0 ? (
          <p className="text-xs text-[hsl(0,0%,50%)] text-center py-4">Nenhum dependente cadastrado</p>
        ) : (
          <div className="space-y-2">
            {dependents.map((dep, i) => (
              <div key={dep.id} className="flex gap-2 text-sm">
                <span className="font-bold text-[hsl(0,0%,9%)] min-w-[20px]">{i + 1}.</span>
                <div>
                  <span className="text-[hsl(0,0%,9%)]">{dep.name}</span>
                  <span className="text-[hsl(0,0%,50%)] ml-1 text-xs">
                    ({relationshipLabels[dep.relationship] || dep.relationship})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 text-center mt-auto">
        <p className="text-[10px] text-[hsl(0,0%,50%)]">
          VERSO DA CARTEIRINHA DIGITAL
        </p>
      </div>
    </div>
  );
}
