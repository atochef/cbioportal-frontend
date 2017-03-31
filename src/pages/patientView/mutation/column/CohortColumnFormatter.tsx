import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutSigData} from "../../PatientViewPage";
import {Mutation} from "../../../../shared/api/generated/CBioPortalAPI";
import {
    VariantCountOutput,
    default as CohortVariantCountCache
} from "../../clinicalInformation/CohortVariantCountCache";
import FrequencyBar from "shared/components/cohort/FrequencyBar";
import Icon from "shared/components/cohort/LetterIcon";

export interface IVariantCountData {
    numberOfSamples?:number;
    geneData?:{ [entrezGeneId:string]: {
        numberOfSamplesWithMutationInGene?:number,
        numberOfSamplesWithKeyword?:{ [keyword:string]:number }
    }};
}

type AugVariantCountOutput = (VariantCountOutput & {hugoGeneSymbol:string});

export default class CohortColumnFormatter {

    public static renderFunction(data:Mutation[], mutSigData:MutSigData | undefined, variantCountCache:CohortVariantCountCache) {
        const mutSigQValue:number|null = CohortColumnFormatter.getMutSigQValue(data, mutSigData);
        const variantCountData = CohortColumnFormatter.getVariantCountData(data, variantCountCache);
        const freqViz = CohortColumnFormatter.makeCohortFrequencyViz(variantCountData);
        return (
                <div>
                    {(freqViz !== null) && freqViz}
                    {(mutSigQValue !== null) && CohortColumnFormatter.makeMutSigIcon(mutSigQValue)}
                </div>
        );
    };

    public static getSortValue(data:Mutation[], variantCountCache:CohortVariantCountCache):number|null {
        const variantCountData = CohortColumnFormatter.getVariantCountData(data, variantCountCache);
        if (variantCountData && variantCountData.data) {
            return variantCountData.data.mutationInGene;
        } else {
            return null;
        }
    }

    private static getVariantCountData(data:Mutation[], cache:CohortVariantCountCache):AugVariantCountOutput | null {
        if (data.length === 0) {
            return null;
        }
        const entrezGeneId = data[0].entrezGeneId;
        const keyword = data[0].keyword;

        let cacheDatum = cache.get(entrezGeneId, keyword);
        if (cacheDatum) {
            return {hugoGeneSymbol:data[0].gene.hugoGeneSymbol, ...cacheDatum};
        } else {
            return null;
        }
    }

    private static getMutSigQValue(data:Mutation[], mutSigData:MutSigData|undefined):number|null {
        if (!mutSigData || data.length === 0) {
            return null;
        }
        const thisData = mutSigData[data[0].entrezGeneId];
        if (!thisData) {
            return null;
        }
        return thisData.qValue;
    }

    private static makeCohortFrequencyViz(variantCount:AugVariantCountOutput | null) {

        if (variantCount === null) {
            return (
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="Querying server for data."
                >
                    LOADING
                </span>
            );
        } else if (variantCount.status === "error") {
            return (<span
                style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                alt="Error retrieving data."
            >
                    ERROR
                </span>);
        } else if (variantCount.data === null) {
            return (
                <span
                    style={{color: "gray", fontSize:"xx-small", textAlign:"center"}}
                    alt="mRNA data is not available for this gene."
                >
                    NA
                </span>
            );
        } else {
            const counts = [variantCount.data.mutationInGene];

            if (variantCount.data.keyword) {
                counts.push(variantCount.data.mutationInKeyword!);
            }

            return (
                <FrequencyBar
                    counts={counts}
                    totalCount={variantCount.data.numberOfSamples}
                    tooltip={CohortColumnFormatter.getCohortFrequencyTooltip(variantCount)}
                />
            );
        }
    }

    private static makeMutSigIcon(qValue:number) {
        const tooltipCallback = () => CohortColumnFormatter.getMutSigTooltip(qValue);

        return (
            <Icon
                text="M"
                tooltip={tooltipCallback}
            />
        );
    }

    private static getBoldPercentage(proportion:number) {
        return (
            <b>
                {(100*proportion).toFixed(1) + "%"}
            </b>
        );
    }

    private static getCohortFrequencyTooltip(variantCount:AugVariantCountOutput | null) {
        let message:string;
        if (variantCount === null) {
            return (<span>Querying server for data.</span>);
        } else if (variantCount.status === "error") {
            return (<span>Error retrieving data.</span>);
        } else if (variantCount.data === null) {
            return (<span>Count data is not available for this gene.</span>);
        } else {
            return (<div>
            <span>{variantCount.data.mutationInGene} samples
            ({CohortColumnFormatter.getBoldPercentage(variantCount.data.mutationInGene / variantCount.data.numberOfSamples)})
            in this study have mutated {variantCount.hugoGeneSymbol}
                {(typeof variantCount.data.keyword !== "undefined") && (
                    <span>
                        , out of which {variantCount.data.mutationInKeyword} ({CohortColumnFormatter.getBoldPercentage(variantCount.data.mutationInKeyword! / variantCount.data.numberOfSamples)}) have {variantCount.data.keyword} mutations
                    </span>
                )}
                .
            </span>
        </div>);
        }
    }

    private static getMutSigTooltip(qValue:number) {
        return (<div>
            <b>MutSig</b><br/>
            <span> Q-value: {(qValue || 0).toExponential(3)}</span>
        </div>);
    }
}