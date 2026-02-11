/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigAlarmDto } from './dto/alarmsConfig.dto';
import { AlarmsTypeDto } from './dto/alarmsType.dto';
import { SnoozeDto } from './dto/snooze.dto';
import { alarmsConfiguration } from './schema/alarmsConfig.schema';
import {
  AlarmRulesSet,
  AlarmRulesSetDocument,
  ThresholdCondition,
} from './schema/alarmsTriggerConfig.schema';
import { AlarmsType } from './schema/alarmsType.schema';
import { Alarms, AlarmsDocument } from './schema/alarmsModel.schema';
import {
  AlarmOccurrence,
  AlarmsOccurrenceDocument,
} from './schema/alarmOccurences.schema';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { getTimeRange, TimeRangePayload } from 'src/helpers/generalTimeFilter';

type AlarmConfigWithPopulate = alarmsConfiguration & {
  _id?: any;
  alarmTriggerConfig?: AlarmRulesSet | null;
  alarmTypeId?: Partial<AlarmsType> | null;
};
@Injectable()
export class AlarmsService {
  private readonly logger = new Logger(AlarmsService.name);
  constructor(
    @InjectModel(AlarmsType.name) private alarmTypeModel: Model<AlarmsType>,
    @InjectModel(alarmsConfiguration.name)
    private alarmsModel: Model<alarmsConfiguration>,
    @InjectModel(AlarmRulesSet.name)
    private alarmsRulesSetModel: Model<AlarmRulesSet>,
    @InjectModel(Alarms.name) private alarmsEventModel: Model<AlarmsDocument>,
    @InjectModel(AlarmOccurrence.name)
    private alarmOccurrenceModel: Model<AlarmsOccurrenceDocument>,
    private readonly httpService: HttpService,
  ) {}

  private readonly intervalsSec = [5, 15, 30, 60, 120];
  private readonly Time = [1, 2, 3, 4, 5];

  private meterSuffixMapping(): Record<string, string[]> {
    return {
      // DIRECT_KPIs - Parameter names ONLY (without location)
      Direct_KPIs: [
        // Voltage Parameters
        'L1L2_Voltage',
        'L2L3_Voltage',
        'L3L1_Voltage',
        'LL_Avg_Voltage',
        'L1N_Voltage',
        'L2N_Voltage',
        'L3N_Voltage',
        'LN_Avg_Voltage',

        // Current Parameters
        'L1_Current',
        'L2_Current',
        'L3_Current',
        'Avg_Current',

        // Power Parameters
        'L1_kW',
        'L2_kW',
        'L3_kW',
        'Total_kW',
        'L1_kVA',
        'L2_kVA',
        'L3_kVA',
        'Total_kVA',
        'L1_kVAR',
        'L2_kVAR',
        'L3_kVAR',
        'Total_kVAR',

        // Power Factor
        'L1_Power_Factor_PC2X',
        'L2_Power_Factor_PC2X',
        'L3_Power_Factor_PC2X',
        'Total_Power_Factor_calculated',

        // Engine Parameters
        'Oil_Pressure',
        'Boost_Pressure',
        'Oil_Temperature',
        'Coolant_Temperature',
        'Intake_Manifold_Temperature_calculated',

        // Battery & Electrical
        'Nominal_Battery_Voltage',
        'Battery_Voltage_calculated',
        'Base_Frequency_calculated',
        'Genset_Frequency_OP_calculated',

        // Ratings
        'Application_Nominal_Current_PC2X',
        'Standby_Nominal_Current_PC2X',
        'Standby_kW_Rating_PC2X',
        'Application_kW_Rating_PC2X',
        'Standby_kVA_Rating_PC2X',
        'Application_kVA_Rating_PC2X',

        // Fuel & Performance
        'Total_Fuel_Consumption_calculated',
        'Averagr_Engine_Speed',
        'Percent_Engine_Torque_or_Duty_Cycle',
        'Fuel_Outlet_Pressure_calculated',
        'Barometric_Absolute_Pressure',
        'Engine_Running_Time_calculated',
        'Fuel_Rate',

        // V/Hz Settings
        'V_Hz_Rolloff_Slope',
        'V_Hz_Knee_Frequency',

        // Run Status
        'Genset_Run_SS',
      ],

      // CUSTOM_KPIs - Calculated Parameters
      Custom_KPIs: [
        // Current calculations
        'Phase-A Share',
        'Phase-B Share',
        'Phase-C Share',
        'Neutral_Current',
        'Current_Imbalance',

        // Voltage calculations
        'Voltage_Imbalance',

        // Power calculations
        'Power_Loss_Factor',

        // Temperature calculations
        'Cooling_Margin',
        'OTSR',

        // Fuel calculations
        'Fuel_Consumption',
        'Fuel_Flow_Change',
        'Fuel_Efficiency_Index',
        'Specific_Fuel_Consumption',

        // Performance calculations
        'Air_Fuel_Effectiveness',
        'Heat_Rate',

        // Load calculations
        'Load_Percent',
        'Lubrication_Risk_Index',
        'Mechanical_Stress_Index',
        'Load_Stress_Index',
        'Thermal_Stress_Index',
        'Electrical_Stress_Index',

        // Stability calculations
        'RPM_Stability_Index',
        'Oscillation_Index',

        // Other calculations
        'I2 Heating',
        'Thermal_Efficiency',
      ],
    };
  }

  async DevicesDropdownList() {
    const mapping = this.meterSuffixMapping();

    return Object.keys(mapping).map((meterId) => ({
      meterId,
      suffixes: mapping[meterId],
    }));
  }

  getMappedLocation(): Record<string, string[]> {
    return {
      Genset: ['Generator1', 'Generator2'],
    };
  }

  async getAlarmsTypeName(): Promise<string[]> {
    const alarmsType = await this.alarmTypeModel
      .find({}, { type: 1, _id: 0 })
      .exec();
    return alarmsType.map((alarm) => alarm.type);
  }

  getIntervals(): number[] {
    return this.intervalsSec;
  }

  getTime(): number[] {
    return this.Time;
  }

  /**
   * Get the list of sub-locations.
   * @returns Array of sub-location strings.
   */

  /**
   * Add a new alarm type.
   * @param dto The data transfer object containing alarm type details.
   * @returns The created alarm type.
   */
  async addAlarmType(dto: AlarmsTypeDto) {
    if (dto.type) {
      dto.type = dto.type.toUpperCase();
    }

    const alarmType = new this.alarmTypeModel(dto);
    await alarmType.save();

    return {
      message: 'Alarm Type added successfully',
      data: alarmType,
    };
  }

  /**
   * Get all alarm types.
   * @returns Array of alarm types.
   */
  async getAllAlarmTypes() {
    return this.alarmTypeModel.find().exec();
  }

  /**
   * Update an existing alarm type.
   * @param id The ID of the alarm type to update.
   * @param dto The data transfer object containing updated alarm type details.
   * @returns The updated alarm type.
   */
  async updateAlarmType(id: string, dto: AlarmsTypeDto) {
    if (dto.type) {
      dto.type = dto.type.toUpperCase();
    }

    const updated = await this.alarmTypeModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw new NotFoundException(`Alarm Type with ID ${id} not found`);
    }

    return {
      message: 'Alarm Type updated successfully',
      data: updated,
    };
  }

  /**
   * Update an existing alarm.
   * @param dto The data transfer object containing updated alarm details.
   * @returns The updated alarm.
   */

  async updateAlarm(dto: UpdateAlarmDto) {
    const {
      alarmConfigId,
      alarmTriggerConfig,
      alarmTypeId,
      ...restUpdateData
    } = dto;

    if (!Types.ObjectId.isValid(alarmConfigId)) {
      throw new BadRequestException('Invalid alarmConfigId');
    }

    const existingAlarm = await this.alarmsModel.findById(alarmConfigId);
    if (!existingAlarm) {
      throw new NotFoundException(`Alarm with ID ${alarmConfigId} not found`);
    }

    const updateData: any = { ...restUpdateData };

    if (alarmTypeId) {
      if (!Types.ObjectId.isValid(alarmTypeId)) {
        throw new BadRequestException('Invalid alarmTypeId');
      }
      updateData.alarmTypeId = new Types.ObjectId(alarmTypeId);
    }

    if (alarmTriggerConfig) {
      if (typeof alarmTriggerConfig === 'object') {
        let rulesetId =
          alarmTriggerConfig._id?.toString() ??
          existingAlarm.alarmTriggerConfig?.toString();

        if (rulesetId && Types.ObjectId.isValid(rulesetId)) {
          const { thresholds, ...restRuleset } = alarmTriggerConfig;

          const rulesetUpdate: any = { ...restRuleset };
          if (Array.isArray(thresholds)) {
            rulesetUpdate.thresholds = thresholds;
          }

          await this.alarmsRulesSetModel.findByIdAndUpdate(
            rulesetId,
            { $set: rulesetUpdate },
            { new: true },
          );

          updateData.alarmTriggerConfig = new Types.ObjectId(rulesetId);
        } else {
          throw new BadRequestException(
            'No valid ruleset found for this alarmConfig',
          );
        }
      } else if (Types.ObjectId.isValid(alarmTriggerConfig)) {
        updateData.alarmTriggerConfig = new Types.ObjectId(alarmTriggerConfig);
      } else {
        throw new BadRequestException('Invalid alarmTriggerConfig');
      }
    }

    const updated = await this.alarmsModel
      .findByIdAndUpdate(alarmConfigId, { $set: updateData }, { new: true })
      .populate('alarmTypeId')
      .populate('alarmTriggerConfig')
      .lean();

    if (!updated) {
      throw new NotFoundException(
        `Alarm with ID ${alarmConfigId} could not be updated`,
      );
    }

    if (!updated.alarmTypeId) {
      updated.alarmTypeId = existingAlarm.alarmTypeId;
    }
    if (!updated.alarmTriggerConfig) {
      updated.alarmTriggerConfig = existingAlarm.alarmTriggerConfig;
    }

    return {
      message: 'Alarm updated successfully',
      data: updated,
    };
  }

  /**
   * Delete an existing alarm.
   * @param alarmConfigId The ID of the alarm to delete.
   * @returns A message indicating the result of the deletion.
   */

  async deleteAlarmByConfigId(alarmConfigId: string) {
    if (!Types.ObjectId.isValid(alarmConfigId)) {
      throw new BadRequestException('Invalid AlarmConfigId');
    }

    const objectId = new Types.ObjectId(alarmConfigId);

    const existingEvent = await this.alarmsEventModel
      .findOne({ alarmConfigId: objectId })
      .populate('alarmOccurrences')
      .lean();

    if (existingEvent && existingEvent.alarmOccurrences?.length > 0) {
      throw new BadRequestException(
        `Cannot delete: AlarmConfig has ${existingEvent.alarmOccurrences.length} related occurrences`,
      );
    }

    const deleted = await this.alarmsModel.findByIdAndDelete(objectId).lean();

    if (!deleted) {
      throw new NotFoundException(`Alarm with ID ${alarmConfigId} not found`);
    }

    return {
      message: 'Alarm Configuration deleted successfully',
      data: deleted,
    };
  }

  /**
   * Delete an existing alarm type.
   * @param id The ID of the alarm type to delete.
   * @returns A message indicating the result of the deletion.
   */
  async deleteAlarmType(id: string) {
    const objectId = new Types.ObjectId(id);
    const relatedAlarms = await this.alarmsModel
      .find({ alarmTypeId: objectId })
      .select('alarmName')
      .lean();

    if (relatedAlarms.length > 0) {
      throw new BadRequestException({
        message: `Cannot delete AlarmType. It is used in ${relatedAlarms.length} alarms.`,
        count: relatedAlarms.length,
        alarms: relatedAlarms.map((a) => a.alarmName),
      });
    }
    console.log('alarms with type');

    const alarmsWithType = await this.alarmsModel.findOne({ alarmTypeId: id });
    if (alarmsWithType) {
      return {
        error: 404,
        message: `Cannot delete: alarms exist with this alarm type.`,
        data: null,
      };
    }

    const deleted = await this.alarmTypeModel.findByIdAndDelete(id);

    return {
      message: 'Alarm Type deleted successfully',
      data: deleted,
    };
  }

  /**
   * Add a new alarm.
   * @param dto The data transfer object containing alarm details.
   * @returns The created alarm.
   */
  // async addAlarm(dto: ConfigAlarmDto) {
  //   const ruleset = new this.alarmsRulesSetModel(dto.alarmTriggerConfig);
  //   await ruleset.save();

  //   const alarm = new this.alarmsModel({
  //     ...dto,
  //     alarmTypeId: new Types.ObjectId(dto.alarmTypeId),
  //     alarmTriggerConfig: ruleset._id,
  //   });

  //   await alarm.save();

  //   return {
  //     message: 'Alarm added successfully',
  //     data: alarm,
  //   };
  // }

  async addAlarm(dto: ConfigAlarmDto) {
    // 1️⃣ Save ruleset first
    const ruleset = new this.alarmsRulesSetModel(dto.alarmTriggerConfig);
    await ruleset.save();

    // 2️⃣ Build alarm object
    const alarmObj: any = {
      ...dto,
      alarmTriggerConfig: ruleset._id,
      alarmTypeId: new Types.ObjectId(dto.alarmTypeId),
      // Make device and subLocation optional
      alarmDevice: dto.alarmDevice || null,
      alarmSubLocation: dto.alarmSubLocation || null,
      // Ensure location & parameter are separate
      alarmLocation: dto.alarmLocation || null,
      alarmParameter: dto.alarmParameter,
    };

    const alarm = new this.alarmsModel(alarmObj);
    await alarm.save();

    return {
      message: 'Alarm added successfully',
      data: alarm,
    };
  }

  /**
   * Get alarms by type.
   * @param alarmTypeId The ID of the alarm type to retrieve alarms for.
   * @returns An object containing a message and the array of alarms.
   */
  async getAlarmsByType(alarmTypeId: string): Promise<{
    message: string;
    data: (alarmsConfiguration & {
      alarmTypeId: AlarmsType;
      alarmTriggerConfig: AlarmRulesSet;
    })[];
  }> {
    const alarms = await this.alarmsModel
      .find({ alarmTypeId: new Types.ObjectId(alarmTypeId) })
      .populate<{ alarmTypeId: AlarmsType }>('alarmTypeId')
      .populate<{ alarmTriggerConfig: AlarmRulesSet }>('alarmTriggerConfig')
      .lean()
      .exec();

    if (!alarms || alarms.length === 0) {
      throw new NotFoundException(`No alarms found for typeId ${alarmTypeId}`);
    }

    return {
      message: 'Alarms fetched successfully',
      data: alarms as unknown as (alarmsConfiguration & {
        alarmTypeId: AlarmsType;
        alarmTriggerConfig: AlarmRulesSet;
      })[],
    };
  }

  /**
   * Get the alarm type associated with a specific alarm.
   * @param alarmId The ID of the alarm to retrieve the type for.
   * @returns An object containing a message and the alarm type.
   */
  async getAlarmTypeByAlarmId(
    alarmId: string,
  ): Promise<{ message: string; data: AlarmsType }> {
    const alarm = await this.alarmsModel
      .findById(alarmId)
      .populate<{ alarmTypeId: AlarmsType }>('alarmTypeId')
      .lean()
      .exec();

    if (!alarm) {
      throw new NotFoundException(`Alarm with ID ${alarmId} not found`);
    }

    if (!alarm.alarmTypeId) {
      throw new NotFoundException(`AlarmType not found for alarmId ${alarmId}`);
    }

    return {
      message: 'AlarmType fetched successfully',
      data: alarm.alarmTypeId as AlarmsType,
    };
  }

  private evaluateCondition(
    value: number,
    operator: string,
    threshold: number,
  ): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      default:
        return false;
    }
  }

  private evaluateRules(value: number, rules: AlarmRulesSet): boolean {
    if (!rules || !Array.isArray(rules.thresholds) || !rules.thresholds.length)
      return false;

    const results = rules.thresholds.map((rule) =>
      this.evaluateCondition(value, rule.operator, rule.value),
    );

    if (rules.conditionType === '&&') return results.every(Boolean);
    if (rules.conditionType === '||') return results.some(Boolean);
    return results[0] ?? false;
  }

  /**
   * Return the first threshold subdocument that matches the value (or undefined).
   */
  private getTriggeredThreshold(
    value: number,
    rules: AlarmRulesSet,
  ): ThresholdCondition | null {
    if (!rules || !rules.thresholds) return null;
    return (
      rules.thresholds.find((t) => {
        switch (t.operator) {
          case '>':
            return value > t.value;
          case '<':
            return value < t.value;
          case '>=':
            return value >= t.value;
          case '<=':
            return value <= t.value;
          case '==':
            return value === t.value;
          case '!=':
            return value !== t.value;
          default:
            return false;
        }
      }) ?? null
    );
  }

  private async generateCustomAlarmId(): Promise<string | null> {
    const last = await this.alarmOccurrenceModel
      .findOne({}, { alarmID: 1 })
      .sort({ createdAt: -1 })
      .lean();

    if (!last || !last.alarmID) {
      return 'ALM01-001';
    }

    const match = last.alarmID.match(/ALM(\d+)-(\d+)/);

    if (!match) {
      return 'ALM01-001';
    }

    const [, majorStr, minorStr] = match;
    let major = parseInt(majorStr, 10);
    let minor = parseInt(minorStr, 10);

    minor++;

    if (minor > 999) {
      minor = 1;
      major++;
    }

    if (major > 99) {
      return null;
    }

    const newMajor = major.toString().padStart(2, '0');
    const newMinor = minor.toString().padStart(3, '0');

    return `ALM${newMajor}-${newMinor}`;
  }

  /**
   * Upsert an active alarm event for the given alarm configuration.
   * If an active event exists it will be updated (count, lastOccurrence, recentOccurrences).
   * Otherwise a new alarm event document will be created.
   */
  private async upsertTriggeredAlarm(
    alarmConfig: AlarmConfigWithPopulate,
    rules: AlarmRulesSet,
    value: number,
  ): Promise<{ event: any; occurrence: AlarmsOccurrenceDocument } | null> {
    const now = new Date();
    const configId = alarmConfig._id;

    const triggered = this.getTriggeredThreshold(value, rules);
    if (!triggered) return null;

    let occurrence = await this.alarmOccurrenceModel.findOne({
      alarmConfigId: configId,
      alarmStatus: true,
    });

    let isNewOccurrence = false;

    if (!occurrence) {
      const customId = await this.generateCustomAlarmId();
      if (!customId) throw new Error('Alarm ID limit reached (ALM99-999)');

      occurrence = await this.alarmOccurrenceModel.create({
        alarmID: customId,
        date: now,
        alarmConfigId: configId,
        alarmRulesetId: rules._id,
        alarmTypeId: alarmConfig.alarmTypeId?._id,
        alarmAcknowledgeStatus: 'Unacknowledged',
        alarmAcknowledgmentAction: '',
        alarmAcknowledgedBy: null,
        alarmAcknowledgedDelay: 0,
        alarmAge: 0,
        alarmDuration: 0,
        alarmAcknowledgmentType: alarmConfig.alarmTypeId?.acknowledgeType,
        alarmSnooze: false,
        snoozeAt: null,
        snoozeDuration: null,
        alarmPresentValue: value,
        alarmThresholdValue: triggered.value,
        alarmThresholdOperator: triggered.operator,
        alarmStatus: true,
        createdAt: now,
        updatedAt: now,
      });

      isNewOccurrence = true;
    } else {
      occurrence.alarmPresentValue = value;
      occurrence.alarmThresholdValue = triggered.value;
      occurrence.alarmThresholdOperator = triggered.operator;

      occurrence.alarmDuration = now.getTime() - occurrence.date.getTime();
      occurrence.updatedAt = now;

      await occurrence.save();
    }

    const eventUpdate: any = {
      $set: { alarmLastOccurrence: now },
      $setOnInsert: { alarmFirstOccurrence: now },
      $addToSet: { alarmOccurrences: occurrence._id },
    };

    if (isNewOccurrence) {
      eventUpdate.$inc = { alarmOccurrenceCount: 1 };
    }

    const event = await this.alarmsEventModel.findOneAndUpdate(
      { alarmConfigId: configId },
      eventUpdate,
      { new: true, upsert: true },
    );

    return { event, occurrence };
  }

  /**
   * Deactivate any currently active alarm events whose config IDs are not in the provided set.
   */
  async deactivateResolvedAlarms(activeConfigIds: Set<string>) {
    const now = new Date();

    const activeEvents = await this.alarmsEventModel
      .find({})
      .populate({
        path: 'alarmOccurrences',
        model: AlarmOccurrence.name,
        match: { alarmStatus: true },
      })
      .exec();

    for (const ev of activeEvents) {
      const cfgId = ev.alarmConfigId?.toString?.() ?? '';

      if (!activeConfigIds.has(cfgId)) {
        ev.alarmLastOccurrence = now;

        if (ev.alarmFirstOccurrence) {
          const durationSec = Math.floor(
            (now.getTime() - new Date(ev.alarmFirstOccurrence).getTime()) /
              1000,
          );

          if (ev.alarmOccurrences?.length) {
            const lastOccurrence =
              ev.alarmOccurrences[ev.alarmOccurrences.length - 1];
            const lastOccurrenceId = lastOccurrence._id ?? lastOccurrence; // handle both populated and non-populated cases

            try {
              await this.alarmOccurrenceModel.findByIdAndUpdate(
                lastOccurrenceId,
                {
                  alarmStatus: false,
                  alarmDuration: durationSec,
                },
              );
            } catch (err) {
              console.error(
                '⚠ Failed to update occurrence duration:',
                err?.message ?? err,
              );
            }
          }
        }

        await ev.save();
      }
    }
  }

  /**
   * Process active alarms by fetching real-time data and evaluating alarm conditions.
   * @returns An array of triggered alarm events.
   */

  // async processActiveAlarms() {
  //   this.logger.log('🚀 Starting alarm processing...');

  //   // ✅ 1️⃣ Get Node-RED real-time data
  //   const resp = await firstValueFrom(
  //     this.httpService.get('http://localhost:1880/navy'),
  //   );

  //   const payload = resp.data as Record<string, any>;
  //   if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
  //     this.logger.error('❌ Invalid data received from Node-RED');
  //     throw new BadRequestException('Invalid data received from Node-RED');
  //   }

  //   this.logger.log(
  //     `✅ Node-RED data received (${Object.keys(payload).length} tags)`,
  //   );

  //   // ✅ 2️⃣ Fetch all alarms from DB
  //   const alarms = (await this.alarmsModel
  //     .find()
  //     .populate<{ alarmTriggerConfig: AlarmRulesSet }>('alarmTriggerConfig')
  //     .populate<{ alarmTypeId: AlarmsType }>('alarmTypeId')
  //     .exec()) as unknown as AlarmConfigWithPopulate[];

  //   this.logger.log(`🔍 Total alarms loaded: ${alarms.length}`);

  //   const triggeredAlarms: any[] = [];
  //   const activeConfigIds = new Set<string>();

  //   // ✅ Helper function for dynamic tag matching
  //   const findMatchingTag = (
  //     alarm: AlarmConfigWithPopulate,
  //     payloadKeys: string[],
  //   ): string | null => {
  //     const alarmLocation = alarm.alarmLocation?.toLowerCase() || '';
  //     const alarmParameter = alarm.alarmParameter.toLowerCase();

  //     for (const tag of payloadKeys) {
  //       const tagLower = tag.toLowerCase();

  //       // Clean the tag by removing common suffixes
  //       const cleanTag = tagLower.replace(
  //         /_(pc2x|calculated|op|r1|r2|hmi113|aux\d+|extended)$/,
  //         '',
  //       );

  //       // Case 1: Exact match with cleaned tag
  //       if (cleanTag === `${alarmLocation}_${alarmParameter}`.toLowerCase()) {
  //         return tag;
  //       }

  //       // Case 2: Match by parameter only (if location is empty)
  //       if (!alarmLocation) {
  //         const tagParam = cleanTag.split('_').pop();
  //         if (tagParam === alarmParameter) {
  //           return tag;
  //         }
  //       }

  //       // Case 3: Parameter appears at the end of the tag
  //       if (cleanTag.endsWith(`_${alarmParameter}`)) {
  //         const possibleLocation = cleanTag.replace(`_${alarmParameter}`, '');
  //         if (!alarmLocation || possibleLocation === alarmLocation) {
  //           return tag;
  //         }
  //       }

  //       // Case 4: Handle complex patterns like "Genset_Genset_L1L2_Voltage"
  //       const parts = cleanTag.split('_');

  //       // Try to match from the end backwards
  //       for (let i = parts.length - 1; i >= 0; i--) {
  //         const currentParam = parts.slice(i).join('_');

  //         if (currentParam === alarmParameter) {
  //           const currentLocation = parts.slice(0, i).join('_') || null;

  //           // If no location specified in alarm, match any location
  //           if (
  //             !alarmLocation ||
  //             !currentLocation ||
  //             currentLocation.includes(alarmLocation)
  //           ) {
  //             return tag;
  //           }
  //         }
  //       }

  //       // Case 5: Partial match - parameter contains part of the tag
  //       if (alarmParameter.includes('_')) {
  //         const paramParts = alarmParameter.split('_');
  //         const lastParamPart = paramParts[paramParts.length - 1];

  //         if (cleanTag.endsWith(`_${lastParamPart}`)) {
  //           return tag;
  //         }
  //       }
  //     }

  //     return null;
  //   };

  //   // ✅ 3️⃣ Evaluate each alarm
  //   for (const alarm of alarms) {
  //     // 🔹 Find matching tag using dynamic matching
  //     const matchingKey = findMatchingTag(alarm, Object.keys(payload));

  //     if (!matchingKey) {
  //       this.logger.debug(
  //         `⚠️ Tag not found for alarm: ${alarm.alarmLocation || 'N/A'}_${alarm.alarmParameter}`,
  //         {
  //           alarmId: alarm._id,
  //           alarmName: alarm.alarmName,
  //           location: alarm.alarmLocation,
  //           parameter: alarm.alarmParameter,
  //         },
  //       );
  //       continue;
  //     }

  //     const value = Number(payload[matchingKey]);

  //     // Check if value is valid
  //     if (isNaN(value)) {
  //       this.logger.warn(
  //         `⚠️ Invalid value for tag ${matchingKey}: ${payload[matchingKey]}`,
  //       );
  //       continue;
  //     }

  //     const rules = alarm.alarmTriggerConfig;

  //     if (!rules || !rules.thresholds?.length) {
  //       this.logger.debug(`⚠️ No trigger rules for: ${alarm.alarmName}`);
  //       continue;
  //     }

  //     const triggered = this.getTriggeredThreshold(value, rules);

  //     // 🔹 Case A: Alarm condition cleared
  //     if (!triggered) {
  //       const now = new Date();
  //       const activeOccurrence = await this.alarmOccurrenceModel
  //         .findOne({ alarmConfigId: alarm._id, alarmStatus: true })
  //         .sort({ date: -1 });

  //       if (activeOccurrence) {
  //         const durationSec = Math.floor(
  //           (now.getTime() - new Date(activeOccurrence.date).getTime()) / 1000,
  //         );

  //         await this.alarmOccurrenceModel.updateOne(
  //           { _id: activeOccurrence._id },
  //           {
  //             $set: {
  //               alarmStatus: false,
  //               alarmDuration: durationSec,
  //               updatedAt: now,
  //             },
  //           },
  //         );

  //         await this.alarmsEventModel.updateOne(
  //           { alarmConfigId: alarm._id },
  //           { $set: { alarmLastOccurrence: now } },
  //         );

  //         this.logger.log(
  //           `✅ Alarm cleared: ${alarm.alarmName} | Duration: ${durationSec}s`,
  //         );
  //       }

  //       continue;
  //     }

  //     // 🔹 Case B: Alarm triggered
  //     const result = await this.upsertTriggeredAlarm(alarm, rules, value);
  //     if (!result) continue;

  //     const { event, occurrence } = result;
  //     activeConfigIds.add(alarm._id.toString());

  //     triggeredAlarms.push({
  //       alarmOccurenceId: occurrence._id,
  //       alarmId: occurrence.alarmID,
  //       alarmStatus: occurrence.alarmStatus,
  //       alarmName: alarm.alarmName,
  //       location: alarm.alarmLocation || matchingKey.split('_')[0],
  //       subLocation: alarm.alarmSubLocation || null,
  //       device: alarm.alarmDevice || null,
  //       parameter: alarm.alarmParameter,
  //       matchedTag: matchingKey, // Added for debugging
  //       value,
  //       threshold: triggered,
  //       triggeredAt: occurrence.date,
  //       alarmType: alarm.alarmTypeId?.type,
  //       priority: alarm.alarmTypeId?.priority,
  //       color: alarm.alarmTypeId?.color,
  //       code: alarm.alarmTypeId?.code,
  //       alarmSnoozeStatus: occurrence.alarmSnooze,
  //       alarmSnoozeDuration: occurrence.snoozeDuration,
  //       alarmSnoozeAt: occurrence.snoozeAt,
  //     });

  //     this.logger.warn(
  //       `🚨 Alarm triggered: ${alarm.alarmName} | Value: ${value} | Threshold: ${triggered} | Tag: ${matchingKey}`,
  //     );
  //   }

  //   // ✅ 4️⃣ Deactivate resolved alarms
  //   await this.deactivateResolvedAlarms(activeConfigIds);

  //   this.logger.log(
  //     `🏁 Alarm processing complete | Active alarms: ${triggeredAlarms.length}`,
  //   );

  //   // ✅ 5️⃣ Log matching statistics for debugging
  //   const matchedCount = triggeredAlarms.length;
  //   const totalAlarms = alarms.length;
  //   this.logger.debug(
  //     `📊 Matching Statistics: ${matchedCount}/${totalAlarms} alarms matched with data`,
  //   );

  //   return triggeredAlarms;
  // }

  async processActiveAlarms() {
    this.logger.log('🚀 Starting alarm processing...');

    const noderedlink = process.env.NODE_RED_LINK;

    if (!noderedlink) {
      throw new Error('NODE_RED_LINK is not defined in environment variables');
    }

    // ✅ 1️⃣ Get Node-RED real-time data
    const resp = await firstValueFrom(this.httpService.get(noderedlink));

    const payload = resp.data as Record<string, any>;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      this.logger.error('❌ Invalid data received from Node-RED');
      throw new BadRequestException('Invalid data received from Node-RED');
    }

    this.logger.log(
      `✅ Node-RED data received (${Object.keys(payload).length} tags)`,
    );

    // ✅ 2️⃣ Fetch all alarms from DB
    const alarms = (await this.alarmsModel
      .find()
      .populate<{ alarmTriggerConfig: AlarmRulesSet }>('alarmTriggerConfig')
      .populate<{ alarmTypeId: AlarmsType }>('alarmTypeId')
      .exec()) as unknown as AlarmConfigWithPopulate[];

    this.logger.log(`🔍 Total alarms loaded: ${alarms.length}`);

    const triggeredAlarms: any[] = [];
    const activeConfigIds = new Set<string>();

    // ✅ SIMPLE & EFFECTIVE Helper function
    const findMatchingTag = (
      alarm: AlarmConfigWithPopulate,
      payloadKeys: string[],
    ): string | null => {
      const alarmLocation = alarm.alarmLocation?.toLowerCase() || '';
      const alarmParameter = alarm.alarmParameter.toLowerCase();

      // 💡 **List of parameters that should be matched WITHOUT location**
      const standaloneParams = [
        // Battery & Electrical
        'nominal_battery_voltage',
        'battery_voltage_calculated',
        'base_frequency_calculated',
        'genset_frequency_op_calculated',

        // Engine Parameters
        'oil_pressure',
        'boost_pressure',
        'oil_temperature',
        'coolant_temperature',
        'intake_manifold_temperature_calculated',

        // Fuel & Performance
        'total_fuel_consumption_calculated',
        'averagr_engine_speed',
        'percent_engine_torque_or_duty_cycle',
        'fuel_outlet_pressure_calculated',
        'barometric_absolute_pressure',
        'engine_running_time_calculated',
        'fuel_rate',

        // V/Hz Settings
        'v_hz_rolloff_slope',
        'v_hz_knee_frequency',

        // Run Status
        'genset_run_ss',

        // Ratings
        'application_nominal_current_pc2x',
        'standby_nominal_current_pc2x',
        'standby_kw_rating_pc2x',
        'application_kw_rating_pc2x',
        'standby_kva_rating_pc2x',
        'application_kva_rating_pc2x',

        // Power Factor
        'total_power_factor_calculated',
      ];

      const isStandalone = standaloneParams.includes(alarmParameter);

      // 🔍 **Strategy 1: For standalone params, match WITHOUT location**
      if (isStandalone) {
        for (const tag of payloadKeys) {
          const tagLower = tag.toLowerCase();

          // 💡 **IMPORTANT: Don't remove "calculated" suffix!**
          // Just compare as-is or with minimal cleaning
          const cleanTag = tagLower.replace(
            /_(pc2x|op|r1|r2|hmi113|aux\d+|extended)$/,
            '',
          );

          if (cleanTag === alarmParameter) {
            this.logger.debug(
              `✅ Standalone match: ${tag} = ${alarmParameter}`,
            );
            return tag;
          }

          // Also try exact match (no cleaning)
          if (tagLower === alarmParameter) {
            this.logger.debug(`✅ Exact match: ${tag} = ${alarmParameter}`);
            return tag;
          }
        }
      }

      // 🔍 **Strategy 2: Try with location if provided**
      if (alarmLocation) {
        const expectedWithLocation = `${alarmLocation}_${alarmParameter}`;
        for (const tag of payloadKeys) {
          const tagLower = tag.toLowerCase();
          const cleanTag = tagLower.replace(/_(pc2x|op)$/, '');

          if (cleanTag === expectedWithLocation) {
            this.logger.debug(
              `✅ Location match: ${tag} = ${expectedWithLocation}`,
            );
            return tag;
          }
        }
      }

      // 🔍 **Strategy 3: Try parameter only (for all params)**
      for (const tag of payloadKeys) {
        const tagLower = tag.toLowerCase();

        // Try exact parameter match first
        if (tagLower === alarmParameter) {
          this.logger.debug(
            `✅ Exact parameter match: ${tag} = ${alarmParameter}`,
          );
          return tag;
        }

        // Try with minimal suffix removal
        const cleanTag = tagLower.replace(/_(pc2x|op)$/, '');
        if (cleanTag === alarmParameter) {
          this.logger.debug(
            `✅ Clean parameter match: ${tag} = ${alarmParameter}`,
          );
          return tag;
        }

        // Try parameter at the end
        if (tagLower.endsWith(`_${alarmParameter}`)) {
          this.logger.debug(`✅ End match: ${tag} ends with ${alarmParameter}`);
          return tag;
        }
      }

      return null;
    };

    // ✅ 3️⃣ Evaluate each alarm
    for (const alarm of alarms) {
      // 🔹 Find matching tag
      const matchingKey = findMatchingTag(alarm, Object.keys(payload));

      if (!matchingKey) {
        this.logger.debug(
          `⚠️ Tag not found for alarm: ${alarm.alarmLocation || 'N/A'}_${alarm.alarmParameter}`,
          {
            alarmId: alarm._id,
            alarmName: alarm.alarmName,
            location: alarm.alarmLocation,
            parameter: alarm.alarmParameter,
          },
        );

        // 💡 **DEBUG: Show what's actually in payload**
        const payloadKeys = Object.keys(payload);
        const similarTags = payloadKeys.filter((tag) =>
          tag
            .toLowerCase()
            .includes(
              alarm.alarmParameter.toLowerCase().replace('_calculated', ''),
            ),
        );

        if (similarTags.length > 0) {
          this.logger.debug(
            `🔍 Similar tags in payload: ${similarTags.slice(0, 5).join(', ')}`,
          );

          // Check if it's a "calculated" issue
          if (alarm.alarmParameter.includes('_calculated')) {
            const withoutCalculated = alarm.alarmParameter.replace(
              '_calculated',
              '',
            );
            const tagsWithoutCalculated = payloadKeys.filter((tag) =>
              tag.toLowerCase().includes(withoutCalculated.toLowerCase()),
            );
            if (tagsWithoutCalculated.length > 0) {
              this.logger.debug(
                `🔍 Try without "_calculated": ${withoutCalculated}`,
              );
              this.logger.debug(
                `🔍 Available: ${tagsWithoutCalculated.slice(0, 3).join(', ')}`,
              );
            }
          }
        }

        continue;
      }

      const value = Number(payload[matchingKey]);

      // Check if value is valid
      if (isNaN(value)) {
        this.logger.warn(
          `⚠️ Invalid value for tag ${matchingKey}: ${payload[matchingKey]}`,
        );
        continue;
      }

      const rules = alarm.alarmTriggerConfig;

      if (!rules || !rules.thresholds?.length) {
        this.logger.debug(`⚠️ No trigger rules for: ${alarm.alarmName}`);
        continue;
      }

      const triggered = this.getTriggeredThreshold(value, rules);

      // 🔹 Case A: Alarm condition cleared
      if (!triggered) {
        const now = new Date();
        const activeOccurrence = await this.alarmOccurrenceModel
          .findOne({ alarmConfigId: alarm._id, alarmStatus: true })
          .sort({ date: -1 });

        if (activeOccurrence) {
          const durationSec = Math.floor(
            (now.getTime() - new Date(activeOccurrence.date).getTime()) / 1000,
          );

          await this.alarmOccurrenceModel.updateOne(
            { _id: activeOccurrence._id },
            {
              $set: {
                alarmStatus: false,
                alarmDuration: durationSec,
                updatedAt: now,
              },
            },
          );

          await this.alarmsEventModel.updateOne(
            { alarmConfigId: alarm._id },
            { $set: { alarmLastOccurrence: now } },
          );

          this.logger.log(
            `✅ Alarm cleared: ${alarm.alarmName} | Duration: ${durationSec}s`,
          );
        }

        continue;
      }

      // 🔹 Case B: Alarm triggered
      const result = await this.upsertTriggeredAlarm(alarm, rules, value);
      if (!result) continue;

      const { event, occurrence } = result;
      activeConfigIds.add(alarm._id.toString());

      triggeredAlarms.push({
        alarmOccurenceId: occurrence._id,
        alarmId: occurrence.alarmID,
        alarmStatus: occurrence.alarmStatus,
        alarmName: alarm.alarmName,
        location: alarm.alarmLocation || matchingKey.split('_')[0],
        subLocation: alarm.alarmSubLocation || null,
        device: alarm.alarmDevice || null,
        parameter: alarm.alarmParameter,
        matchedTag: matchingKey,
        value,
        threshold: triggered,
        triggeredAt: occurrence.date,
        alarmType: alarm.alarmTypeId?.type,
        priority: alarm.alarmTypeId?.priority,
        color: alarm.alarmTypeId?.color,
        code: alarm.alarmTypeId?.code,
        alarmSnoozeStatus: occurrence.alarmSnooze,
        alarmSnoozeDuration: occurrence.snoozeDuration,
        alarmSnoozeAt: occurrence.snoozeAt,
      });

      this.logger.warn(
        `🚨 Alarm triggered: ${alarm.alarmName} | Value: ${value} | Threshold: ${triggered} | Tag: ${matchingKey}`,
      );
    }

    // ✅ 4️⃣ Deactivate resolved alarms
    await this.deactivateResolvedAlarms(activeConfigIds);

    this.logger.log(
      `🏁 Alarm processing complete | Active alarms: ${triggeredAlarms.length}`,
    );

    // ✅ 5️⃣ Log matching statistics for debugging
    const matchedCount = triggeredAlarms.length;
    const totalAlarms = alarms.length;
    this.logger.debug(
      `📊 Matching Statistics: ${matchedCount}/${totalAlarms} alarms matched with data`,
    );

    return triggeredAlarms;
  }

  async gethistoricalAlarms(filters: any = {}) {
    const match: any = {};

    if (filters.alarmAcknowledgeStatus) {
      match['alarmOccurrences.alarmAcknowledgeStatus'] =
        filters.alarmAcknowledgeStatus;
    }

    if (filters.alarmStatus !== undefined) {
      match['alarmOccurrences.alarmStatus'] = filters.alarmStatus;
    }

    // Time range filter (range, from-to, date)
    if (filters.range || filters.from || filters.to || filters.date) {
      const { start, end } = getTimeRange(filters as TimeRangePayload);

      match['alarmOccurrences.date'] = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const results = await this.alarmsEventModel.aggregate([
      // Populate alarmOccurrences
      {
        $lookup: {
          from: 'alarmsOccurrence',
          localField: 'alarmOccurrences',
          foreignField: '_id',
          as: 'alarmOccurrences',
        },
      },

      // Populate alarmAcknowledgedBy inside alarmOccurrences
      {
        $unwind: {
          path: '$alarmOccurrences',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$alarmOccurrences.alarmAcknowledgedBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
            { $project: { password: 0 } }, // exclude password
          ],
          as: 'alarmOccurrences.alarmAcknowledgedBy',
        },
      },
      {
        $unwind: {
          path: '$alarmOccurrences.alarmAcknowledgedBy',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Populate alarmConfigure
      {
        $lookup: {
          from: 'alarmsConfiguration',
          localField: 'alarmConfigId',
          foreignField: '_id',
          as: 'alarmConfigure',
        },
      },
      {
        $unwind: { path: '$alarmConfigure', preserveNullAndEmptyArrays: true },
      },

      // Populate alarmType inside alarmConfigure
      {
        $lookup: {
          from: 'alarmsType',
          localField: 'alarmConfigure.alarmTypeId',
          foreignField: '_id',
          as: 'alarmConfigure.alarmType',
        },
      },
      {
        $unwind: {
          path: '$alarmConfigure.alarmType',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Apply filters
      { $match: match },

      // Regroup occurrences back into array
      {
        $group: {
          _id: '$_id',
          alarmConfigId: { $first: '$alarmConfigId' },
          alarmConfigure: { $first: '$alarmConfigure' },
          alarmOccurrenceCount: { $first: '$alarmOccurrenceCount' },
          alarmAcknowledgementStatusCount: {
            $first: '$alarmAcknowledgementStatusCount',
          },
          alarmFirstOccurrence: { $first: '$alarmFirstOccurrence' },
          alarmLastOccurrence: { $first: '$alarmLastOccurrence' },
          alarmOccurrences: { $push: '$alarmOccurrences' },
        },
      },
    ]);

    return {
      data: results,
      total: results.length,
    };
  }

  async acknowledgementActions() {
    const results = await this.alarmsModel.find(
      {}, // filter (sab documents)
      { acknowledgementActions: 1, _id: 0 }, // projection (sirf acknowledgementActions field)
    );
    const merged = results.flatMap((r) => r.acknowledgementActions || []);
    // merge all arrays into single array
    return [...new Set(merged)]; // return unique values only
  }

  async acknowledgeOne(
    occurrenceId: string,
    action: string,
    acknowledgedBy: string,
  ) {
    const occurrence = await this.alarmOccurrenceModel.findById(occurrenceId);
    if (!occurrence) throw new NotFoundException('Occurrence not found');

    if (occurrence.alarmAcknowledgeStatus === 'Acknowledged') {
      throw new Error('This occurrence is already acknowledged');
    }

    const now = new Date();
    const delay = (now.getTime() - new Date(occurrence.date).getTime()) / 1000;

    // ✅ Update occurrence
    occurrence.alarmAcknowledgeStatus = 'Acknowledged';
    occurrence.alarmAcknowledgmentAction = action;
    occurrence.alarmAcknowledgedBy = new Types.ObjectId(acknowledgedBy);
    occurrence.alarmAcknowledgedDelay = delay;
    await occurrence.save();

    // ✅ Update parent alarm
    const parentAlarm = await this.alarmsEventModel.findOne({
      alarmOccurrences: occurrence._id,
    });

    if (parentAlarm) {
      const acknowledgedCount = await this.alarmOccurrenceModel.countDocuments({
        _id: { $in: parentAlarm.alarmOccurrences },
        alarmAcknowledgeStatus: 'Acknowledged',
      });

      parentAlarm.alarmAcknowledgementStatusCount = acknowledgedCount;
      await parentAlarm.save();
    }

    // ✅ Fetch populated occurrence
    const populatedOccurrence = await this.alarmOccurrenceModel
      .findById(occurrence._id)
      .populate('alarmAcknowledgedBy', 'name email');

    // ✅ Fetch parent alarm with populated occurrences + acknowledgedBy
    const populatedParentAlarm = parentAlarm
      ? await this.alarmsEventModel.findById(parentAlarm._id).populate({
          path: 'alarmOccurrences',
          populate: { path: 'alarmAcknowledgedBy', select: 'name email' },
        })
      : null;

    return {
      updatedOccurrences: [populatedOccurrence], // 🔹 same shape as acknowledgeMany
      parentAlarms: populatedParentAlarm ? [populatedParentAlarm] : [],
    };
  }

  /**
   * Acknowledge multiple occurrences at once
   */
  async acknowledgeMany(occurrenceIds: string[], acknowledgedBy: string) {
    const now = new Date();

    // ✅ Cast all IDs to ObjectId
    const objectIds = occurrenceIds.map((id) => new Types.ObjectId(id));

    // ✅ Update occurrences in bulk
    await this.alarmOccurrenceModel.updateMany(
      {
        _id: { $in: objectIds },
        alarmAcknowledgeStatus: { $ne: 'Acknowledged' },
      },
      {
        $set: {
          alarmAcknowledgeStatus: 'Acknowledged',
          alarmAcknowledgmentAction: 'Auto Mass Acknowledged',
          alarmAcknowledgedBy: new Types.ObjectId(acknowledgedBy),
          alarmAcknowledgedDelay: 0,
        },
      },
    );

    const occurrences = await this.alarmOccurrenceModel.find({
      _id: { $in: objectIds },
    });

    // Find unique parent alarms
    const parentAlarms = await this.alarmsEventModel.find({
      alarmOccurrences: { $in: objectIds },
    });

    for (const parentAlarm of parentAlarms) {
      const acknowledgedCount = await this.alarmOccurrenceModel.countDocuments({
        _id: { $in: parentAlarm.alarmOccurrences },
        alarmAcknowledgeStatus: 'Acknowledged',
      });

      parentAlarm.alarmAcknowledgementStatusCount = acknowledgedCount;
      await parentAlarm.save();
    }

    return { updatedOccurrences: occurrences, parentAlarms };
  }

  // alarms-occurrence.service.ts
  async snoozeAlarm(snoozeDto: SnoozeDto) {
    const { ids, alarmSnooze, snoozeDuration, snoozeAt } = snoozeDto;

    const updated = await this.alarmOccurrenceModel.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          alarmSnooze,
          snoozeDuration,
          snoozeAt: new Date(snoozeAt),
        },
      },
      { runValidators: true },
    );

    if (updated.modifiedCount === 0) {
      throw new NotFoundException('No alarm occurrences updated');
    }

    return { message: `Alarms snoozed successfully` };
  }
}
