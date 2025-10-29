import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TrendsService } from './trends.service';

@Injectable()
export class PrewarmService implements OnModuleInit, OnModuleDestroy {
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(private readonly trendsService: TrendsService) {}

  async onModuleInit() {
    // console.log('🚀 Prewarming cache (startup)...');
    await this.runPrewarm();

    // ♻️ Auto-refresh every 10 minutes (customize interval here)
    this.refreshInterval = setInterval(
      () => {
        this.runPrewarm().catch((err) =>
          console.error(' refresh failed:', err.message),
        );
      },
      10 * 60 * 1000,
    ); // 10 minutes
  }

  onModuleDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  private async runPrewarm() {
    const prewarmConfigs = [
      {
        mode: 'range',
        startDate: '2025-10-01T00:00:00.000Z',
        endDate: '2025-10-05T00:00:00.000Z',
        params: [
          'Genset_LN_Avg_Voltage',
          'Oil_Pressure',
          'Fuel_Rate',
          'Genset_Total_kW',
          'RPM_Stability_Index',
          'Heat_Rate',
        ],
      },
      {
        mode: 'historic',
        startDate: '2025-10-03T00:00:00.000Z',
        endDate: '2025-10-04T00:00:00.000Z',
        params: [
          'Genset_L1_Current',
          'Coolant_Temperature',
          'Load_Percent',
          'Fuel_Consumption',
        ],
      },
    ];

    const results = await Promise.allSettled(
      prewarmConfigs.map(async (config) => {
        const start = Date.now();
        await this.trendsService.getTrends(config);
        return `${config.mode} → ${Date.now() - start} ms`;
      }),
    );

    console.log('✅ Cache prewarm cycle complete:');
    results.forEach((r, i) => {
      if (r.status === 'fulfilled')
        console.log(`   • ${prewarmConfigs[i].mode}: ${r.value}`);
      else console.warn(`   ⚠️ ${prewarmConfigs[i].mode} failed: ${r.reason}`);
    });
  }
}
