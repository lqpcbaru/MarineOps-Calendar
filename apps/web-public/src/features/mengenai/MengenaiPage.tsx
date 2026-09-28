import { PageContainer } from '../../shared/components';

export function MengenaiPage() {
  return (
    <PageContainer title="Mengenai" description="Maklumat mengenai MarineOps Hub dan misi kami.">
      <div className="surface px-5 py-4">
        <p className="text-text-secondary">
          MarineOps Hub ialah platform perancangan operasi marin yang menggabungkan data keadaan
          laut — pasang surut, cuaca, angin dan ombak, fasa bulan, serta waktu matahari — dalam satu
          paparan bersepadu untuk membantu perancangan operasi laut.
        </p>
      </div>
    </PageContainer>
  );
}
