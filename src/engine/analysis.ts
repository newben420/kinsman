import {
    MACD, PSAR, Stochastic, bullish, bearish, VWAP, ADL, ATR, AwesomeOscillator,
    TRIX, ADX, CCI, MFI, RSI, darkcloudcover,
    piercingline, eveningstar, threeblackcrows,
    tweezertop, hangingman, shootingstar,
    IchimokuCloud,
    StochasticRSI,
    SMA,
    EMA,
    WMA,
    threewhitesoldiers,
    morningstar,
    hammerpattern,
    tweezerbottom,
    abandonedbaby,
    bullishengulfingpattern,
    morningdojistar,
    dragonflydoji,
    bullishharami,
    bullishmarubozu,
    bullishharamicross,
    bearishengulfingpattern,
    eveningdojistar,
    gravestonedoji,
    bearishharami,
    bearishmarubozu,
    bearishharamicross,
    KST,
} from 'technicalindicators';
import { Site } from '../site';
import { Signal } from '../model/signal';
import { Candlestick } from '../model/candlestick';
import { Log } from '../lib/log';
import { getDateTime2, getTimeElapsed } from '../lib/date_time';
import { booleanConsolidator } from '../lib/boolean_consolidator';
import { FFF } from '../lib/format_number';

export class AnalysisEngine {
    private static slug = "Analysis";

    /**
     * Holds previous entry values per token for Bullish.
     */
    private static isEntryBull: Record<string, boolean[]> = {};

    /**
     * Holds previous entry values per token for Bearish.
     */
    private static isEntryBear: Record<string, boolean[]> = {};

    static removePair = (symbol: string): void => {
        // delete AnalysisEngine.multilayeredHistory[symbol];
        delete AnalysisEngine.isEntryBear[symbol];
        delete AnalysisEngine.isEntryBull[symbol];
    }

    static stop = () => new Promise<boolean>((resolve, reject) => {
        resolve(true);
    })

    private static getParamsForInd = (ind: string) => {
        const p = Object.keys(Site.IN_CFG).filter(x => x.startsWith(ind));
        return p.length ? `(${p.map(x => `${Site.IN_CFG[x]}`).join("/")})` : '(default params)';
    };

    private static lastTS: number = 0;

    static run = (symbol: string, data: Candlestick[]) => {
        return new Promise<Signal | null>((resolve, reject) => {
            Log.flow([AnalysisEngine.slug, symbol, `Initialized.`], 5);
            if (data.length >= (Site.IN_CFG.MN_DATA_LEN || 10)) {
                let ts = Date.now();
                if (ts == AnalysisEngine.lastTS) {
                    ts = ts + 1;
                }
                AnalysisEngine.lastTS = ts;
                const open = data.map(x => x.open);
                const high = data.map(x => x.high);
                const low = data.map(x => x.low);
                const close = data.map(x => x.close);
                const volume = data.map(x => x.volume);
                const latestRate = close[close.length - 1] || 0;
                const csd = { open, close, high, low };

                let userPrompt: string[][] = [
                    [
                        `Ticker: ${symbol}`,
                        `Data: ${data.length}x${getTimeElapsed(0, Site.PE_INTERVAL_MS).split(" ")[0]} (${getDateTime2(Date.now() - (Site.PE_INTERVAL_MS * data.length))} → ${getDateTime2(Date.now())})`,
                        `Price: ${latestRate}`,
                    ], // INPUT DATA
                    [], // STEP 1
                    [], // STEP 2
                    [], // STEP 3
                    [], // STEP 4
                    [], // STEP 5
                    [], // STEP 6
                    [], // STEP 7
                    [], // PREVIOUS ANALYSIS
                ];
                let currentStep: number = 0;

                let cache: Record<string, any> = {
                    PSR: null,
                    PSR_BULL: null,
                    PSR_BEAR: null,
                    PSR_SL: null,
                    MCD: null,
                    MCD_BULL: null,
                    MCD_BEAR: null,
                    ICH: null,
                    ICH_BULL: null,
                    ICH_BEAR: null,
                    ICH_SL: null,
                    BLL_BULL: null,
                    BLL_BEAR: null,
                    KST_BULL: null,
                    KST_BEAR: null,
                    SMA_BULL: null,
                    SMA_BEAR: null,
                    EMA_BULL: null,
                    EMA_BEAR: null,
                    WMA_BULL: null,
                    WMA_BEAR: null,
                    VWP_BULL: null,
                    VWP_BEAR: null,
                    AOS_BULL: null,
                    AOS_BEAR: null,
                    TRX_BULL: null,
                    TRX_BEAR: null,
                    STRONG: null,
                    STC_OB: null,
                    STC_OS: null,
                    RSI_OB: null,
                    RSI_OS: null,
                    CCI_OB: null,
                    CCI_OS: null,
                    MFI_OB: null,
                    MFI_OS: null,
                    BBS_OB: null,
                    BBS_OS: null,
                    SRS_OB: null,
                    SRS_OS: null,
                    SRS_BULL: null,
                    SRS_BEAR: null,
                    STR: null,
                    HGM: null,
                    BAR: null,
                    EST: null,
                    TBC: null,
                    PIL: null,
                    DCC: null,
                    TTP: null,
                    TWS: null,
                    MST: null,
                    HMR: null,
                    TBT: null,
                    ABB: null,
                    BEP: null,
                    EDS: null,
                    GSD: null,
                    BRH: null,
                    BRM: null,
                    BHC: null,
                    BLE: null,
                    MDS: null,
                    DFD: null,
                    BLH: null,
                    BLM: null,
                    BLC: null,
                    ATR: null,
                    ENTRY: null,
                };

                const ensureInd: any = {
                    PSR: () => {
                        if (!cache.PSR) {
                            const psar = PSAR.calculate({ high, low, step: Site.IN_CFG.PSR_ST ?? 0.02, max: Site.IN_CFG.PSR_MX ?? 0.2 });
                            const psarBull = (psar[psar.length - 1] ?? latestRate) < latestRate;
                            const psarBear = (psar[psar.length - 1] ?? latestRate) > latestRate;
                            const sl = psar[psar.length - 1] || 0;
                            cache.PSR = true;
                            cache.PSR_BULL = psarBull;
                            cache.PSR_BEAR = psarBear;
                            cache.PSR_SL = sl;
                        }
                        if (cache.PSR_BULL || cache.PSR_BEAR) userPrompt[currentStep].push(`${currentStep == 6 ? `${cache.PSR_SL} (PSAR)` : ''} ${(currentStep == 1 || (currentStep == 6 && Site.STR_TSL_IND != Site.STR_ENTRY_IND)) ? `${AnalysisEngine.getParamsForInd('PSR_').replace("ST", "step").replace("mx", "max") || "default"}` : ''}`);
                    },
                    MCD: () => {
                        if (!cache.MCD) {
                            const macd = MACD.calculate({ values: close, fastPeriod: Site.IN_CFG.MCD_FSP ?? 12, slowPeriod: Site.IN_CFG.MCD_SLP ?? 26, signalPeriod: Site.IN_CFG.MCD_SGP ?? 9, SimpleMAOscillator: false, SimpleMASignal: false });
                            const macdBull: boolean =
                                macd.length > 0
                                    ? ((macd[macd.length - 1].MACD !== undefined || macd[macd.length - 1].MACD === 0) &&
                                        (macd[macd.length - 1].signal !== undefined || macd[macd.length - 1].signal === 0))
                                        ? macd[macd.length - 1].MACD! > macd[macd.length - 1].signal!
                                        : false
                                    : false;

                            const macdBear: boolean =
                                macd.length > 0
                                    ? ((macd[macd.length - 1].MACD !== undefined || macd[macd.length - 1].MACD === 0) &&
                                        (macd[macd.length - 1].signal !== undefined || macd[macd.length - 1].signal === 0))
                                        ? macd[macd.length - 1].MACD! < macd[macd.length - 1].signal!
                                        : false
                                    : false;
                            cache.MCD = true;
                            cache.MCD_BULL = macdBull;
                            cache.MCD_BEAR = macdBear;
                        }
                        if (cache.MCD_BULL || cache.MCD_BEAR) userPrompt[currentStep].push(`${currentStep == 2 ? `MACD: ${cache.MCD_BULL ? 'Bullish' : cache.MCD_BEAR ? 'Bearish' : 'No Trend'}` : ''} ${(currentStep == 1 || (currentStep == 2 && (!Site.STR_TREND_IND.includes(Site.STR_ENTRY_IND)))) ? `${AnalysisEngine.getParamsForInd('MCD_').replace("FSP", "fast period").replace("SLP", "slow period").replace("SGP", "signal period") || "default"}` : ''}`);
                    },
                    SRS: () => {
                        if (cache.SRS_OB === null) {
                            const srsi = StochasticRSI.calculate({
                                dPeriod: Site.IN_CFG.STC_SP ?? 3,
                                kPeriod: Site.IN_CFG.STC_SP ?? 3,
                                rsiPeriod: Site.IN_CFG.RSI_P ?? 14,
                                stochasticPeriod: Site.IN_CFG.STC_P ?? 14,
                                values: close,
                            });
                            const OB = (((srsi[srsi.length - 1] || {}).stochRSI || 0) > 80) &&
                                (((srsi[srsi.length - 1] || {}).d || 0) > 80) &&
                                (((srsi[srsi.length - 1] || {}).k || 0) > 80);
                            const OS = (((srsi[srsi.length - 1] || {}).stochRSI || 100) < 20) &&
                                (((srsi[srsi.length - 1] || {}).d || 100) < 20) &&
                                (((srsi[srsi.length - 1] || {}).k || 100) < 20);
                            cache.SRS_OB = OB;
                            cache.SRS_OS = OS;
                            cache.SRS_BULL = !OS;
                            cache.SRS_BEAR = !OB;
                        }
                        if ((cache.ENTRY === true && cache.SRS_OB) || (cache.ENTRY === false && cache.SRS_OS)) userPrompt[currentStep].push(`STOCH RSI ${(AnalysisEngine.getParamsForInd('STC_').replace("SP", "stoch signal period").replace("P", "stoch period").replace(")", "") + '/' + AnalysisEngine.getParamsForInd('RSI_').replace("P", "rsi period").replace("(", "")) || "default"}`);
                    },
                    ICH: () => {
                        if (!cache.ICH) {
                            const ichimoku = IchimokuCloud.calculate({
                                high,
                                low,
                                conversionPeriod: Site.IN_CFG.ICH_CVP ?? 9,
                                basePeriod: Site.IN_CFG.ICH_BSP ?? 26,
                                spanPeriod: Site.IN_CFG.ICH_SPP ?? 52,
                                displacement: Site.IN_CFG.ICH_DIS ?? 26,
                            });
                            const conversion = (ichimoku[ichimoku.length - 1] || {}).conversion ?? 0;
                            const base = (ichimoku[ichimoku.length - 1] || {}).base ?? 0;
                            const spanA = (ichimoku[ichimoku.length - 1] || {}).spanA ?? 0;
                            const spanB = (ichimoku[ichimoku.length - 1] || {}).spanB ?? 0;
                            const lag = close[close.length - (Site.IN_CFG.ICH_DIS ?? 26) - 1] ?? 0;
                            const lagSpanA = (ichimoku[ichimoku.length - 1 - (Site.IN_CFG.ICH_DIS ?? 26)] || {}).spanA ?? 0;
                            const lagSpanB = (ichimoku[ichimoku.length - 1 - (Site.IN_CFG.ICH_DIS ?? 26)] || {}).spanB ?? 0;
                            const bull = (latestRate > spanA) && (spanA > spanB) && (conversion > base) && (lag > Math.max(lagSpanA, lagSpanB));
                            const bear = (latestRate < spanA) && (spanA < spanB) && (conversion < base) && (lag < Math.min(lagSpanA, lagSpanB));
                            let sl = spanB;
                            cache.ICH = true;
                            cache.ICH_BULL = bull;
                            cache.ICH_BEAR = bear;
                            cache.ICH_SL = sl;
                        }
                        if (cache.ICH_BULL || cache.ICH_BEAR) userPrompt[currentStep].push(`${currentStep == 6 ? `${cache.ICH_SL} (ICH)` : ''} ${(currentStep == 1 || (currentStep == 6 && Site.STR_TSL_IND != Site.STR_ENTRY_IND)) ? `${AnalysisEngine.getParamsForInd('ICH_').replace("CVP", "conversion period").replace("BSP", "base period").replace("SPP", "span period").replace("DIS", "displacement") || "default"}` : ''}`);
                    },
                    BLL: () => {
                        if (cache.BLL_BULL === null) {
                            cache.BLL_BULL = bullish(csd);
                            cache.BLL_BEAR = bearish(csd);
                        }
                        if (cache.BLL_BULL || cache.BLL_BEAR) userPrompt[currentStep].push(`CANDLE: ${cache.BLL_BULL ? 'Bullish' : cache.BLL_BEAR ? 'Bearish' : 'No Trend'}`);
                    },
                    SMA: () => {
                        if (cache.SMA_BULL === null) {
                            const ma = SMA.calculate({ values: close, period: Site.IN_CFG.MAP ?? 20 });
                            cache.SMA_BULL = latestRate > (ma[ma.length - 1] || Infinity);
                            cache.SMA_BEAR = latestRate < (ma[ma.length - 1] || 0);
                        }
                        if (cache.SMA_BULL || cache.SMA_BEAR) userPrompt[currentStep].push(`SMA: ${cache.SMA_BULL ? 'Bullish' : cache.SMA_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('MAP') ? `${AnalysisEngine.getParamsForInd('MAP')}` : "default"}`);
                    },
                    KST: () => {
                        if (cache.KST_BULL === null) {
                            const kst = KST.calculate({
                                ROCPer1: Site.IN_CFG.KST_RP1 ?? 10,
                                ROCPer2: Site.IN_CFG.KST_RP2 ?? 15,
                                ROCPer3: Site.IN_CFG.KST_RP3 ?? 20,
                                ROCPer4: Site.IN_CFG.KST_RP4 ?? 30,
                                signalPeriod: Site.IN_CFG.KST_SGP ?? 9,
                                SMAROCPer1: Site.IN_CFG.KST_SP1 ?? 10,
                                SMAROCPer2: Site.IN_CFG.KST_SP2 ?? 10,
                                SMAROCPer3: Site.IN_CFG.KST_SP3 ?? 10,
                                SMAROCPer4: Site.IN_CFG.KST_SP4 ?? 15,
                                values: close,
                            });
                            const bull = (((kst[kst.length - 1] || {}).kst || Number.MIN_VALUE) > ((kst[kst.length - 1] || {}).signal || 0))
                                && (((kst[kst.length - 1] || {}).kst || Number.MIN_VALUE) > 0);
                            const bear = (((kst[kst.length - 1] || {}).kst || Number.MAX_VALUE) < ((kst[kst.length - 1] || {}).signal || 0))
                                && (((kst[kst.length - 1] || {}).kst || Number.MAX_VALUE) < 0);
                            cache.KST_BULL = bull;
                            cache.KST_BEAR = bear;
                        }
                        if (cache.KST_BULL || cache.KST_BEAR) userPrompt[currentStep].push(`KST: ${cache.KST_BULL ? 'Bullish' : cache.KST_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('KST_').replace(/RP/g, "ROC period ").replace(/SG/, "signal period ").replace(/SP/g, "SMA ROC period ") || "default"}`);
                    },
                    EMA: () => {
                        if (cache.EMA_BULL === null) {
                            const ma = EMA.calculate({ values: close, period: Site.IN_CFG.MAP ?? 20 });
                            cache.EMA_BULL = latestRate > (ma[ma.length - 1] || Infinity);
                            cache.EMA_BEAR = latestRate < (ma[ma.length - 1] || 0);
                        }
                        if (cache.EMA_BULL || cache.EMA_BEAR) userPrompt[currentStep].push(`EMA: ${cache.EMA_BULL ? 'Bullish' : cache.EMA_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('MAP') ? `${AnalysisEngine.getParamsForInd('MAP')}` : "default"}`);
                    },
                    WMA: () => {
                        if (cache.WMA_BULL === null) {
                            const ma = WMA.calculate({ values: close, period: Site.IN_CFG.MAP ?? 20 });
                            cache.WMA_BULL = latestRate > (ma[ma.length - 1] || Infinity);
                            cache.WMA_BEAR = latestRate < (ma[ma.length - 1] || 0);
                        }
                        if (cache.WMA_BULL || cache.WMA_BEAR) userPrompt[currentStep].push(`WMA: ${cache.WMA_BULL ? 'Bullish' : cache.WMA_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('MAP') ? `${AnalysisEngine.getParamsForInd('MAP')}` : "default"}`);
                    },
                    VWP: () => {
                        if (cache.VWP_BULL === null) {
                            const vwap = VWAP.calculate({ close, high, low, volume });
                            cache.VWP_BULL = latestRate > (vwap[vwap.length - 1] || Infinity);
                            cache.VWP_BEAR = latestRate < (vwap[vwap.length - 1] || 0);
                        }
                        if (cache.VWP_BULL || cache.VWP_BEAR) userPrompt[currentStep].push(`VWAP: ${cache.VWP_BULL ? 'Bullish' : cache.VWP_BEAR ? 'Bearish' : 'No Trend'}`);
                    },
                    AOS: () => {
                        if (cache.AOS_BULL === null) {
                            const ao = AwesomeOscillator.calculate({ high, low, fastPeriod: Site.IN_CFG.AOS_FSP ?? 5, slowPeriod: Site.IN_CFG.AOS_SLP ?? 34 });
                            cache.AOS_BULL = (ao[ao.length - 1] || 0) > 0;
                            cache.AOS_BEAR = (ao[ao.length - 1] || 0) < 0;
                        }
                        if (cache.AOS_BULL || cache.AOS_BEAR) userPrompt[currentStep].push(`AO: ${cache.AOS_BULL ? 'Bullish' : cache.AOS_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('AOS_').replace("FSP", "fast period").replace("SLP", "slow period") || "default"}`);
                    },
                    TRX: () => {
                        if (cache.TRX_BULL === null) {
                            const trix = TRIX.calculate({ values: close, period: Site.IN_CFG.TRX_P ?? 15 });
                            cache.TRX_BULL = (trix[trix.length - 1] || 0) > 0;
                            cache.TRX_BEAR = (trix[trix.length - 1] || 0) < 0;
                        }
                        if (cache.TRX_BULL || cache.TRX_BEAR) userPrompt[currentStep].push(`TRIX: ${cache.TRX_BULL ? 'Bullish' : cache.TRX_BEAR ? 'Bearish' : 'No Trend'} ${AnalysisEngine.getParamsForInd('TRX_').replace("P", "period") || "default"}`);
                    },
                    ADX: () => {
                        if (cache.STRONG === null) {
                            const adx = ADX.calculate({ close, high, low, period: Site.IN_CFG.ADX_P ?? 14 });
                            cache.STRONG = ((adx[adx.length - 1] || {}).adx || 0) >= 25;
                        }
                        userPrompt[currentStep].push(`ADX = ${cache.STRONG ? 'Strong' : 'Not Strong'} ${AnalysisEngine.getParamsForInd('ADX_').replace("P", "period") || "default"}`);
                    },
                    STC: () => {
                        if (cache.STC_OB === null) {
                            const stoch = Stochastic.calculate({ close, high, low, period: Site.IN_CFG.STC_P ?? 14, signalPeriod: Site.IN_CFG.STC_SP ?? 3 });
                            cache.STC_OB = ((stoch[stoch.length - 1] || {}).k || 0) > 80;
                            cache.STC_OS = ((stoch[stoch.length - 1] || {}).k || Infinity) < 20;
                        }
                        if ((cache.ENTRY === true && cache.STC_OB) || (cache.ENTRY === false && cache.STC_OS)) userPrompt[currentStep].push(`STOCH ${AnalysisEngine.getParamsForInd('STC_').replace("P", "period").replace("SP", "signal period") || "default"}`);
                    },
                    RSI: () => {
                        if (cache.RSI_OB === null) {
                            const rsi = RSI.calculate({ values: close, period: Site.IN_CFG.RSI_P ?? 14 });
                            cache.RSI_OB = (rsi[rsi.length - 1] || 0) > 70;
                            cache.RSI_OS = (rsi[rsi.length - 1] || Infinity) < 30;
                        }
                        if ((cache.ENTRY === true && cache.RSI_OB) || (cache.ENTRY === false && cache.RSI_OS)) userPrompt[currentStep].push(`RSI ${AnalysisEngine.getParamsForInd('RSI_').replace("P", "period") || "default"}`);
                    },
                    CCI: () => {
                        if (cache.CCI_OB === null) {
                            const cci = CCI.calculate({ close, high, low, period: Site.IN_CFG.CCI_P ?? 14 });
                            cache.CCI_OB = (cci[cci.length - 1] || 0) > 100;
                            cache.CCI_OB = (cci[cci.length - 1] || Infinity) < -100;
                        }
                        if ((cache.ENTRY === true && cache.CCI_OB) || (cache.ENTRY === false && cache.CCI_OS)) userPrompt[currentStep].push(`CCI ${AnalysisEngine.getParamsForInd('CCI_').replace("P", "period") || "default"}`);
                    },
                    MFI: () => {
                        if (cache.MFI_OB === null) {
                            const mfi = MFI.calculate({ close, volume, high, low, period: Site.IN_CFG.MFI_P ?? 14 });
                            cache.MFI_OB = (mfi[mfi.length - 1] || 0) > 80;
                            cache.MFI_OS = (mfi[mfi.length - 1] || Infinity) < 20;
                        }
                        if ((cache.ENTRY === true && cache.MFI_OB) || (cache.ENTRY === false && cache.MFI_OS)) userPrompt[currentStep].push(`MFI ${AnalysisEngine.getParamsForInd('MFI_').replace("P", "period") || "default"}`);
                    },
                    STR: () => {
                        if (cache.STR === null) {
                            cache.STR = shootingstar(csd);
                        }
                        if ((cache.ENTRY === true) && cache.STR) userPrompt[currentStep].push(`Shooting Star`);
                    },
                    HGM: () => {
                        if (cache.HGM === null) {
                            cache.HGM = hangingman(csd);
                        }
                        if ((cache.ENTRY === true) && cache.HGM) userPrompt[currentStep].push(`Hanging Man`);

                    },
                    EST: () => {
                        if (cache.EST === null) {
                            cache.EST = eveningstar(csd);
                        }
                        if ((cache.ENTRY === true) && cache.EST) userPrompt[currentStep].push(`Evening Star`);
                    },
                    TBC: () => {
                        if (cache.TBC === null) {
                            cache.TBC = threeblackcrows(csd);
                        }
                        if ((cache.ENTRY === true) && cache.TBC) userPrompt[currentStep].push(`Three Black Crows`);

                    },
                    PIL: () => {
                        if (cache.PIL === null) {
                            cache.PIL = piercingline(csd);
                        }
                        if ((cache.ENTRY === true) && cache.PIL) userPrompt[currentStep].push(`Piercing Line`);
                    },
                    DCC: () => {
                        if (cache.DCC === null) {
                            cache.DCC = darkcloudcover(csd);
                        }
                        if ((cache.ENTRY === true) && cache.DCC) userPrompt[currentStep].push(`Dark Cloud Cover`);
                    },
                    TTP: () => {
                        if (cache.TTP === null) {
                            cache.TTP = tweezertop(csd);
                        }
                        if ((cache.ENTRY === true) && cache.TTP) userPrompt[currentStep].push(`Tweezer Top`);
                    },
                    TWS: () => {
                        if (cache.TWS === null) {
                            cache.TWS = threewhitesoldiers(csd);
                        }
                        if ((cache.ENTRY === false) && cache.TWS) userPrompt[currentStep].push(`Three White Soldiers`);
                    },
                    MST: () => {
                        if (cache.MST === null) {
                            cache.MST = morningstar(csd);
                        }
                        if ((cache.ENTRY === false) && cache.MST) userPrompt[currentStep].push(`Morning Star`);
                    },
                    HMR: () => {
                        if (cache.HMR === null) {
                            cache.HMR = hammerpattern(csd);
                        }
                        if ((cache.ENTRY === false) && cache.HMR) userPrompt[currentStep].push(`Hammer Pattern`);
                    },
                    TBT: () => {
                        if (cache.TBT === null) {
                            cache.TBT = tweezerbottom(csd);
                        }
                        if ((cache.ENTRY === false) && cache.TBT) userPrompt[currentStep].push(`Tweezer Bottom`);
                    },
                    ABB: () => {
                        if (cache.ABB === null) {
                            cache.ABB = abandonedbaby(csd);
                        }
                        if (cache.ABB) userPrompt[currentStep].push(`Abandoned Baby`);
                    },
                    BLE: () => {
                        if (cache.BLE === null) {
                            cache.BLE = bullishengulfingpattern(csd);
                        }
                        if ((cache.ENTRY === false) && cache.BLE) userPrompt[currentStep].push(`Bullish Engulfing Pattern`);
                    },
                    MDS: () => {
                        if (cache.MDS === null) {
                            cache.MDS = morningdojistar(csd);
                        }
                        if ((cache.ENTRY === false) && cache.MDS) userPrompt[currentStep].push(`Morning Doji Star`);
                    },
                    DFD: () => {
                        if (cache.DFD === null) {
                            cache.DFD = dragonflydoji(csd);
                        }
                        if ((cache.ENTRY === false) && cache.DFD) userPrompt[currentStep].push(`Dragon Fly Doji`);
                    },
                    BLH: () => {
                        if (cache.BLH === null) {
                            cache.BLH = bullishharami(csd);
                        }
                        if ((cache.ENTRY === false) && cache.BLH) userPrompt[currentStep].push(`Bullish Harami`);
                    },
                    BLM: () => {
                        if (cache.BLM === null) {
                            cache.BLM = bullishmarubozu(csd);
                        }
                        if ((cache.ENTRY === false) && cache.BLM) userPrompt[currentStep].push(`Bullish Marubozu`);
                    },
                    BLC: () => {
                        if (cache.BLC === null) {
                            cache.BLC = bullishharamicross(csd);
                        }
                        if ((cache.ENTRY === false) && cache.BLC) userPrompt[currentStep].push(`Bullish Harami Cross`);
                    },
                    BEP: () => {
                        if (cache.BEP === null) {
                            cache.BEP = bearishengulfingpattern(csd);
                        }
                        if ((cache.ENTRY === true) && cache.BEP) userPrompt[currentStep].push(`Bearish Engulfing Pattern`);
                    },
                    EDS: () => {
                        if (cache.EDS === null) {
                            cache.EDS = eveningdojistar(csd);
                        }
                        if ((cache.ENTRY === true) && cache.EDS) userPrompt[currentStep].push(`Evening Doji Star`);
                    },
                    GSD: () => {
                        if (cache.GSD === null) {
                            cache.GSD = gravestonedoji(csd);
                        }
                        if ((cache.ENTRY === true) && cache.GSD) userPrompt[currentStep].push(`Gravestone Doji`);
                    },
                    BRH: () => {
                        if (cache.BRH === null) {
                            cache.BRH = bearishharami(csd);
                        }
                        if ((cache.ENTRY === true) && cache.BRH) userPrompt[currentStep].push(`Bearish Harami`);
                    },
                    BRM: () => {
                        if (cache.BRM === null) {
                            cache.BRM = bearishmarubozu(csd);
                        }
                    },
                    BHC: () => {
                        if (cache.BHC === null) {
                            cache.BHC = bearishharamicross(csd);
                        }
                        if ((cache.ENTRY === true) && cache.BHC) userPrompt[currentStep].push(`Bearish Harami Cross`);
                    },
                    ATR: () => {
                        if (cache.ATR === null) {
                            const atr = ATR.calculate({ period: Site.IN_CFG.ATR_P ?? 14, close, high, low });
                            const perc = ((atr[atr.length - 1] || 0) / latestRate) * 100;
                            cache.ATR = perc;
                        }
                        userPrompt[currentStep].push(`ATR = ${(cache.ATR || 0).toFixed(2)}% of price ${AnalysisEngine.getParamsForInd('ATR_').replace("P", "period") || "default"}`);
                    },
                };

                /**
                 * Computes entry point.
                 */
                const step1 = (): boolean|null => {
                    currentStep = 1;
                    ensureInd[Site.STR_ENTRY_IND]();
                    if (!AnalysisEngine.isEntryBull[symbol]) {
                        AnalysisEngine.isEntryBull[symbol] = [];
                    }
                    if (!AnalysisEngine.isEntryBear[symbol]) {
                        AnalysisEngine.isEntryBear[symbol] = [];
                    }
                    AnalysisEngine.isEntryBull[symbol].push(cache[`${Site.STR_ENTRY_IND}_BULL`] || false);
                    AnalysisEngine.isEntryBear[symbol].push(cache[`${Site.STR_ENTRY_IND}_BEAR`] || false);
                    if (AnalysisEngine.isEntryBull[symbol].length > (Site.IN_CFG.DIR_LEN || 5)) {
                        AnalysisEngine.isEntryBull[symbol] = AnalysisEngine.isEntryBull[symbol].slice(AnalysisEngine.isEntryBull[symbol].length - (Site.IN_CFG.DIR_LEN || 5));
                    }
                    if (AnalysisEngine.isEntryBear[symbol].length > (Site.IN_CFG.DIR_LEN || 5)) {
                        AnalysisEngine.isEntryBear[symbol] = AnalysisEngine.isEntryBear[symbol].slice(AnalysisEngine.isEntryBear[symbol].length - (Site.IN_CFG.DIR_LEN || 5));
                    }
                    if (AnalysisEngine.isEntryBull[symbol].length >= 2 ? (((AnalysisEngine.isEntryBull[symbol][AnalysisEngine.isEntryBull[symbol].length - 1]) && (!AnalysisEngine.isEntryBull[symbol][AnalysisEngine.isEntryBull[symbol].length - 2]))) : false) {
                        return true;
                    }
                    if (AnalysisEngine.isEntryBear[symbol].length >= 2 ? (((AnalysisEngine.isEntryBear[symbol][AnalysisEngine.isEntryBear[symbol].length - 1]) && (!AnalysisEngine.isEntryBear[symbol][AnalysisEngine.isEntryBear[symbol].length - 2]))) : false) {
                        return false;
                    }
                    return null;
                }

                /**
                 * Confirms trend.
                 */
                const step2 = (): boolean => {
                    currentStep = 2;
                    for (let i = 0; i < Site.STR_TREND_IND.length; i++) {
                        ensureInd[Site.STR_TREND_IND[i]]();
                    }
                    currentStep = 0;
                    const bools: boolean[] = Site.STR_TREND_IND.map(x => cache[`${x}_${cache.ENTRY ? 'BULL' : 'BEAR'}`] || false);
                    return booleanConsolidator(bools, Site.STR_TREND_CV);
                }

                /**
                 * Confirms strong trend.
                 */
                const step3 = (): boolean => {
                    currentStep = 3;
                    ensureInd.ADX();
                    currentStep = 0;
                    return cache.STRONG || false;
                }

                /**
                 * Detects overbought.
                 */
                const step4 = (): boolean => {
                    currentStep = 4;
                    for (let i = 0; i < Site.STR_OB_IND.length; i++) {
                        ensureInd[Site.STR_OB_IND[i]]();
                    }
                    currentStep = 0;
                    const bools: boolean[] = Site.STR_OB_IND.map(x => cache[`${x}_${cache.ENTRY ? 'OB' : 'OS'}`] || false);
                    return booleanConsolidator(bools, Site.STR_OB_CV);
                }

                /**
                 * Detects reversal patterns.
                 */
                const step5 = (): boolean => {
                    currentStep = 5;
                    for (let i = 0; i < (cache.ENTRY ? Site.STR_REV_IND_BULL : Site.STR_REV_IND_BEAR).length; i++) {
                        ensureInd[(cache.ENTRY ? Site.STR_REV_IND_BULL : Site.STR_REV_IND_BEAR)[i]]();
                    }
                    currentStep = 0;
                    const bools: boolean[] = (cache.ENTRY ? Site.STR_REV_IND_BULL : Site.STR_REV_IND_BEAR).map(x => cache[`${x}`] || false);
                    return booleanConsolidator(bools, Site.STR_REV_CV);
                }

                /**
                 * Computes stoploss price.
                 */
                const step6 = (): number => {
                    currentStep = 6;
                    ensureInd[Site.STR_TSL_IND]();
                    currentStep = 0;
                    if (cache.ENTRY === true) {
                        return cache[`${Site.STR_TSL_IND}_SL`] < latestRate ? cache[`${Site.STR_TSL_IND}_SL`] : (latestRate - (cache[`${Site.STR_TSL_IND}_SL`] - latestRate));
                    }
                    else if (cache.ENTRY === false) {
                        return cache[`${Site.STR_TSL_IND}_SL`] > latestRate ? cache[`${Site.STR_TSL_IND}_SL`] : (latestRate + (latestRate - cache[`${Site.STR_TSL_IND}_SL`]));
                    }
                    return 0;
                }

                /**
                 * Ensures price volatility is within suitable percentage range.
                 */
                const step7 = (): boolean => {
                    currentStep = 7;
                    ensureInd.ATR();
                    currentStep = 0;
                    return cache.ATR >= (Site.STR_VOL_RNG[0] || 0) && cache.ATR <= (Site.STR_VOL_RNG[1] || Infinity);
                }

                let stoploss = 0;
                let long = false;
                let short = false;
                let desc = "No Signal";

                Log.flow([AnalysisEngine.slug, symbol, `Checking for entry...`], 6);
                cache.ENTRY = step1();
                const flip = (cache.ENTRY === true) ? "Bullish flip" : (cache.ENTRY === false) ? "Bearish flip" : "";
                const sig = (cache.ENTRY === true) ? "Long" : (cache.ENTRY === false) ? "Short" : "";
                userPrompt[currentStep][0] = `${Site.STR_ENTRY_IND.replace("ICH", "ICH").replace("PSR", "PSAR").replace("MCD", "MACD")} = ${flip} → ${sig} ${userPrompt[currentStep][0]}`;
                currentStep = 0;
                if (cache.ENTRY === true || cache.ENTRY === false) {
                    // Entry detected.
                    Log.flow([AnalysisEngine.slug, symbol, `Entry detected. Confirming ${cache.ENTRY ? 'bull' : 'bear'} trend...`], 6);
                    if ((step2() && Site.STR_TREND_FV) || (!Site.STR_TREND_FV)) {
                        // Trend confirmed.
                        Log.flow([AnalysisEngine.slug, symbol, `Trend confirmed. Checking trend strength...`], 6);
                        if ((step3() && Site.STR_STG_FV) || (!Site.STR_STG_FV)) {
                            // Trend strength confirmed.
                            Log.flow([AnalysisEngine.slug, symbol, `Strength is acceptable. Checking if over${cache.ENTRY ? 'bought' : 'sold'}...`], 6);
                            Log.flow([AnalysisEngine.slug, symbol, ``], 6);
                            if (((!step4()) && Site.STR_OB_FV) || (!Site.STR_OB_FV)) {
                                // No presence of effecting overbought confirmed.
                                Log.flow([AnalysisEngine.slug, symbol, `Overbought condition acceptable. Checking for reversals...`], 6);
                                if (((!step5()) && Site.STR_REV_FV) || (!Site.STR_REV_FV)) {
                                    Log.flow([AnalysisEngine.slug, symbol, `Reversal conditions acceptable. Checking volatility...`], 6);
                                    // No reversl detected.
                                    if (step7()) {
                                        // Volatility is acceptable
                                        Log.flow([AnalysisEngine.slug, symbol, `Volatility is acceptable. Buy signal confirmed.`], 6);
                                        if (cache.ENTRY) {
                                            long = true;
                                            desc = "Confirmed Long"
                                        }
                                        else {
                                            short = true;
                                            desc = "Confirmed Short"
                                        }
                                    }
                                    else {
                                        Log.flow([AnalysisEngine.slug, symbol, `Volatility out of range.`], 6);
                                    }
                                }
                                else {
                                    Log.flow([AnalysisEngine.slug, symbol, `Trend reversal detected.`], 6);
                                }
                            }
                            else {
                                Log.flow([AnalysisEngine.slug, symbol, `Ticker is overbought`], 6);
                            }
                        }
                        else {
                            Log.flow([AnalysisEngine.slug, symbol, `Strength not acceptable.`], 6);
                        }
                    }
                    else {
                        Log.flow([AnalysisEngine.slug, symbol, `Trend not confirmed.`], 6);
                    }
                }
                else {
                    Log.flow([AnalysisEngine.slug, symbol, `No entry detected.`], 6);
                }

                stoploss = step6();

                const signal = new Signal(short, long, desc, cache.ATR, stoploss, latestRate, userPrompt);

                cache = Object.fromEntries(Object.entries(cache).filter(([__dirname, v]) => v !== null));

                // CONCLUDE ANALYSIS
                Log.flow([AnalysisEngine.slug, symbol, "Success", `Long: ${signal.long ? "Yes" : "No"} | Short: ${signal.short ? "Yes" : "No"} | Price: ${FFF(latestRate)}${stoploss ? ` | Stoploss: ${FFF(stoploss)}` : ""}.`], 5);
                if (signal.long || signal.short) {
                    resolve(signal);
                }
                else{
                    resolve(null);
                }
            }
            else {
                Log.flow([AnalysisEngine.slug, symbol, "Error", `Not enough rows.`], 5);
                resolve(null);
            }
        })
    }
}