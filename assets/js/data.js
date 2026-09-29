/* ==========================================================================
   PAGE DATA: the single source for every measured value shown on this page.

   Every value is copied from the NeurIPS 2026 manuscript (main text and
   appendix) or from the result files released with it. Each group names its
   source. index.html contains no measured numbers: main.js renders the
   tables, the charts and every [data-bind] span from this object, so a
   refresh is a one-line edit here.

   Protocol constants that define the framework (the B = 64 window, the
   budget grid B in {16, 32, 48, 64}, eight claim types, seven prompt pools,
   seven paired comparisons over five source corpora, nine source families)
   are part of the prose, not of this block.

   Display rules: counts and ranges the manuscript states as text are stored
   as strings and shown verbatim; table cells are stored as numbers and shown
   with the manuscript's decimals (sup. CBU and CBU/cap: 2, risk: 3, lex: 1).

   Image-conditioned cells (supported CBU per caption, risk) are read from
   the released result file cbu_vqa_by_category_b64.json: for each (slice,
   judge, surface) cell, m = all_types.supported_cap or all_types.risk and
   sd = the matching *_std field (caption-level bootstrap). Claimed CBU/cap
   and CBU/100 lex of the control surfaces come from the claimed_cbu_summary
   files of the same bundle (claimed_dedup_per_caption, _per_100_tokens).

   Uncertainty: any numeric cell may be written as { m: <mean>, sd: <std> }
   instead of a bare number. Tables then print "mean ± std" and the Table 5
   chart draws a ±std whisker; plain numbers print as they are. Example:
     qwen: { sup: { m: 13.73, sd: 0.05 }, risk: { m: 0.035, sd: 0.001 } }
   ========================================================================== */
(function () {
  "use strict";


  window.PAGE_DATA = {
    /* Lay summary shown at the top of the page under "In plain words".
       One string: paragraphs are separated by a blank line (\n\n) and each
       opens with one emoji. Replace the whole string to change the text. */
    laySummary:
      "🖼️ AI image generators learn by looking at millions of pictures, each with a short description. Today most of those descriptions are written by another AI, not by people.\n\n" +
      "🤔 But are those AI-written descriptions any good? Until now, finding out meant training a whole image generator, like baking an entire cake just to check whether the flour is fresh.\n\n" +
      "🔍 We built a simple check-up instead. Part of it is as easy as a teacher flipping through a stack of essays and noticing that they all begin with the same sentence: we count how often descriptions repeat themselves. Then we read the first 64 words of each description and ask: does it sound like what people actually type when they ask for an image? How many concrete things does it say about the picture, and is each one really there? Two different AI judges answer that last question, and we compared them with human annotators.\n\n" +
      "✅ Our descriptions say more true things about each picture, and fewer wrong things, than existing long descriptions of the same pictures. The instructions make the difference: the same AI, simply told to “describe this picture in detail”, says about a quarter fewer true things.\n\n" +
      "🎁 We are sharing descriptions for about 490 million images, plus the check-up tool, so anyone can test their own.",

    /* Stated ranges and totals, quoted as written.
       Abstract; Section 1 (Introduction, paragraph 3 and contribution list);
       Section 5 intro; Section 5.1; Section 6; Appendix A; Appendix Table 16. */
    summary: {
      supGain:       { lo: "+3.39", hi: "+6.36" },   // Abstract, Sec. 1: supported CBU per caption, 4 pairs x 2 judges
      claimedGain:   { lo: "+2.91", hi: "+6.14" },   // Sec. 1: claimed CBU per caption
      riskDrop:      { lo: "−0.046", hi: "−0.159" }, // Sec. 1: unsupported risk
      supGainShort:  "+3.4 to +6.4",                 // Sec. 5.1
      riskDropShort: "0.05 to 0.16",                 // Sec. 5.1
      exclCountRelationGain: "+2.66 to +5.22",       // Sec. 5.1 / App. Table 16 (w/o count and relation claims)
      poolWins:      "5–7",                      // Sec. 5.1: prompt pools (of seven) where Ours raises support
      lengthMultiple: "3–5×",               // Sec. 5.1: Ours length vs. each reference except LAION-pop
      identities:    "≈490M",                    // Sec. 1, App. A: image identities, unique within each family
      gpuHours:      "≈12.7k"                    // Sec. 6, App. A: H200 GPU-hours for caption generation
    },

    /* Sample sizes. Section 5 intro; Table 4 caption; Section 5.2; App. B. */
    protocol: {
      captionOnlyRows: "50,000",   // paired rows per slice: text statistics and prompt-pool support
      vqaRows:         "≈5,000",   // of those rows per surface: claim extraction and both judges
      cc12mAligned:    "4,494",    // CC12M images shared by all four surfaces
      poolRecords:     "250,000",  // prompts per prompt-reference pool (App. B, Fig. 3)
      // short forms for table cells (Table 4 caption: 50k paired rows; ≈5k rows per surface)
      captionOnlyShort: "50k",
      vqaShort:         "5k"
    },

    /* Table 1: closest prior audits and caption metrics, as a check matrix.
       One row per work; `group` starts a new block (rules between blocks).
       marks follow `relatedColumns` after Work and Target: "✓" or "–". */
    relatedColumns: ["Real", "Corpus", "Unit", "Image", "Budget", "Prompt"],
    relatedLegend: [
      ["Real", "text paired with non-generated images"],
      ["Corpus", "dataset-level analysis"],
      ["Unit", "text scored per claim or object mention"],
      ["Image", "text verified against the image"],
      ["Budget", "fixed text window"],
      ["Prompt", "register of user prompts"]
    ],
    relatedWork: [
      { group: "Dataset and caption studies", work: "REVISE",        target: "visual datasets",      marks: ["✓", "✓", "–", "–", "–", "–"] },
      { group: "Dataset and caption studies", work: "LAION's Den",   target: "image–alt-text pairs", marks: ["✓", "✓", "–", "–", "–", "–"] },
      { group: "Dataset and caption studies", work: "Hirota et al.", target: "caption enrichment",   marks: ["✓", "✓", "✓", "✓", "–", "–"] },
      { group: "Dataset and caption studies", work: "Brack et al.",  target: "training captions",    marks: ["✓", "✓", "–", "–", "–", "–"] },
      { group: "Claim-level metrics",         work: "TIFA / DSG",    target: "generated images",     marks: ["–", "–", "✓", "✓", "–", "–"] },
      { group: "Claim-level metrics",         work: "FAITHSCORE",    target: "VLM answers",          marks: ["✓", "–", "✓", "✓", "–", "–"] },
      { group: "Claim-level metrics",         work: "DCScore",       target: "detailed captions",    marks: ["✓", "–", "✓", "✓", "–", "–"] },
      { group: "Ours",                        work: "Ours",          target: "recaptioned corpora",  marks: ["✓", "✓", "✓", "✓", "✓", "✓"], ours: true }
    ],

    /* Table 4: audit axes (Axis | Property | Input | Metric | Rows).
       `rows` names the protocol field that gives the row count. Metric and
       input strings may carry <i>, <sub> and the math class "m". */
    axes: [
      { axis: "Text budget",           des: "Coverage",     input: '<span class="m"><i>D<sub>c</sub></i></span>',
        metric: 'Avg. lex, <span class="m"><i>B</i></span>-eligibility',                       rows: "captionOnlyShort" },
      { axis: "Prompt-pool support",   des: "Coverage",     input: '<span class="m"><i>D<sub>c</sub></i></span>, pools',
        metric: "prompt-mass support ↑, <i>n</i>-gram JSD ↓",                                rows: "captionOnlyShort" },
      { axis: "Claimed density",       des: "Coverage",     input: '<span class="m"><i>D<sub>c</sub></i></span>',
        metric: "CBU/cap ↑, CBU/100 lex",                                                     rows: "vqaShort" },
      { axis: "Surface concentration", des: "Health",       input: '<span class="m"><i>D<sub>c</sub></i></span>',
        metric: "top-100 prefix mass ↓, distinct-3 ↑",                                        rows: "captionOnlyShort" },
      { axis: "Support and risk",      des: "Faithfulness", input: '<span class="m"><i>D<sub>cx</sub></i></span>',
        metric: '<span class="m">𝔼[<i>s</i>]</span> ↑, <span class="m"><i>ρ</i></span> ↓', rows: "vqaShort" }
    ],

    /* Table 5: Cross-corpus headline at B = 64 lexical units.
       Cells are Ref -> Ours. Risk is unsupported / claimed CBU. */
    crossCorpus: [
      { id: "datacomp", pair: "DataComp", ref: "Recap-DataComp",
        lex: [50.9, 175.5], cbu: [10.44, 14.45], poolWins: 6,
        qwen:  { sup: [{ m: 8.493488, sd: 0.047549 }, { m: 13.726472, sd: 0.053975 }],
                 risk: [{ m: 0.177117, sd: 0.002584 }, { m: 0.034918, sd: 0.001015 }] },
        gemma: { sup: [{ m: 8.003053, sd: 0.047748 }, { m: 12.936701, sd: 0.053373 }],
                 risk: [{ m: 0.218942, sd: 0.002811 }, { m: 0.081108, sd: 0.00144 }] } },
      { id: "laionpop", pair: "LAION-pop", ref: "LAION-pop-Llama",
        lex: [180.3, 182.9], cbu: [11.91, 14.82], poolWins: 5,
        qwen:  { sup: [{ m: 10.799434, sd: 0.043858 }, { m: 14.222491, sd: 0.050725 }],
                 risk: [{ m: 0.077178, sd: 0.00148 }, { m: 0.030698, sd: 0.000809 }] },
        gemma: { sup: [{ m: 10.220582, sd: 0.043118 }, { m: 13.613059, sd: 0.050663 }],
                 risk: [{ m: 0.113135, sd: 0.001799 }, { m: 0.060131, sd: 0.001174 }] } },
      { id: "pd12m", pair: "PD12M", ref: "PD12M released",
        lex: [39.7, 189.1], cbu: [9.78, 15.02], poolWins: 7,
        qwen:  { sup: [{ m: 8.605532, sd: 0.046062 }, { m: 14.294854, sd: 0.053252 }],
                 risk: [{ m: 0.103082, sd: 0.001942 }, { m: 0.033619, sd: 0.000827 }] },
        gemma: { sup: [{ m: 8.225095, sd: 0.046505 }, { m: 13.530373, sd: 0.05353 }],
                 risk: [{ m: 0.130814, sd: 0.002229 }, { m: 0.065961, sd: 0.001223 }] } },
      { id: "danbooru", pair: "Danbooru", ref: "Danbooru-Florence",
        lex: [43.6, 164.5], cbu: [8.18, 14.33], poolWins: 7,
        qwen:  { sup: [{ m: 6.379956, sd: 0.042837 }, { m: 12.736926, sd: 0.046415 }],
                 risk: [{ m: 0.217421, sd: 0.003051 }, { m: 0.058273, sd: 0.001412 }] },
        gemma: { sup: [{ m: 6.146508, sd: 0.040419 }, { m: 11.853937, sd: 0.044073 }],
                 risk: [{ m: 0.234523, sd: 0.003205 }, { m: 0.09383, sd: 0.001469 }] } }
    ],

    /* Table 8: CC12M frontier at B = 64, four surfaces, both judges.
       All columns use the same 4,494 aligned images. The dagger marks the
       short tag-style surface, read against Eq. (1) for window
       density. Section 5.3 text: PixelProse at ~89 lex; Qwen3-VL at ~12 lex. */
    cc12m: {
      surfaces: [
        { name: "Ours", ours: true,  cbu: 15.21, per100: 23.16,
          qwen: { sup: { m: 14.595926, sd: 0.056766 }, risk: { m: 0.030462, sd: 0.000899 } },
          gemma: { sup: { m: 13.823371, sd: 0.055083 }, risk: { m: 0.066408, sd: 0.001255 } } },
        { name: "CC12M-LLaVA-NeXT",  cbu: 10.78, per100: 21.77,
          qwen: { sup: { m: 9.842129, sd: 0.048002 }, risk: { m: 0.06891, sd: 0.001528 } },
          gemma: { sup: { m: 9.43903, sd: 0.045467 }, risk: { m: 0.09669, sd: 0.001749 } } },
        { name: "PixelProse",        cbu: 12.57, per100: 20.44,
          qwen: { sup: { m: 10.730052, sd: 0.049993 }, risk: { m: 0.128865, sd: 0.002082 } },
          gemma: { sup: { m: 10.195999, sd: 0.047582 }, risk: { m: 0.16052, sd: 0.00214 } } },
        // CC12M-Qwen3-VL-8B captions: shown by role ("Short tag surface") in tables;
        // the page names the model once, in the "Efficiency and yield read jointly" passage.
        { name: "Short tag surface", dagger: true, cbu: 6.44, per100: 55.84,
          qwen: { sup: { m: 6.312249, sd: 0.026174 }, risk: { m: 0.013628, sd: 0.000846 } },
          gemma: { sup: { m: 6.194432, sd: 0.025576 }, risk: { m: 0.028294, sd: 0.001294 } } }
      ],
      pixelProseLex: "≈89",
      qwen3vlLex:    "≈12",
      tagSurfaceModel: "Qwen3-VL-8B",
      // Sec. 5.3: dual-judge gap on supported CBU per caption (Qwen minus Gemma),
      // from the unrounded judge means (14.596 - 13.823 = 0.77 for Ours)
      dualGap: { tag: "0.12", llava: "0.40", pixelprose: "0.53", ours: "0.77" },
      // Sec. 5.3 "Length is not density" paragraph: one 64-word window of Ours vs. a whole CC12M-Qwen3-VL caption
      windowMultiple: "2.4×",
      // Sec. 5.3 "Budget sweep": Ours from B = 16 to B = 64
      sweepOursCbu:    "5.59 → 15.21",
      sweepOursPer100: "33.9 → 23.2"
    },

    /* Figure 1 (right) caption: JSD gap on the length-matched LAION-pop pair. */
    figure1: { laionPopJsdGap: "0.01" },

    /* Budget sweep behind Figure 2 (right): claimed CBU per caption and
       CBU per 100 lex at B in {16, 32, 48, 64}, all 4,494 aligned images.
       Source: released result file cc12m_budget_frontier_plot.csv
       (columns cbu_per_cap, cbu_per_100tok), rounded to two decimals.
       B = 64 equals Table 8. The three long-form surfaces only, as in Figure 2. */
    sweep: {
      budgets: [16, 32, 48, 64],
      surfaces: [
        { name: "Ours", ours: true,
          cbu: [5.59, 9.47, 12.43, 15.21], per100: [33.86, 28.78, 25.20, 23.16] },
        { name: "CC12M-LLaVA-NeXT",
          cbu: [4.96, 8.02, 9.64, 10.78],  per100: [30.68, 26.70, 23.75, 21.77] },
        { name: "PixelProse",
          cbu: [4.17, 7.63, 10.34, 12.57], per100: [25.78, 23.71, 21.66, 20.44] }
      ]
    },

    /* Table 6: Captioner control, one captioner (Qwen3.5-35B-A3B), two
       policies, same decoding, same images: CC12M 4,494 images, DataComp
       4,775 images. Ours and Naive only (the greedy-decoding Naive rows stay
       in the result files). Claimed CBU/cap and CBU/100 lex: CC12M Ours is
       Table 8; the others come from claimed_cbu_summary.json of
       naive_qwen35_sampled_cc12m, policy_control_ours_datacomp and
       naive_qwen35_sampled_datacomp. Support and risk: cells "CC12M" /
       "CC12M-control" and "DataComp-control" of cbu_vqa_by_category_b64.json. */
    captionerControl: [
      { source: "CC12M", rows: [
        { surface: "Ours", ours: true, cbu: 15.21, per100: 23.16,
          qwen: { sup: { m: 14.595926, sd: 0.056766 }, risk: { m: 0.030462, sd: 0.000899 } },
          gemma: { sup: { m: 13.823371, sd: 0.055083 }, risk: { m: 0.066408, sd: 0.001255 } } },
        { surface: "Naive", cbu: 11.32, per100: 17.26,
          qwen: { sup: { m: 11.026154, sd: 0.046975 }, risk: { m: 0.022042, sd: 0.000782 } },
          gemma: { sup: { m: 10.607687, sd: 0.045696 }, risk: { m: 0.045491, sd: 0.001115 } } }
      ]},
      { source: "DataComp", rows: [
        { surface: "Ours", ours: true, cbu: 14.60, per100: 22.23,
          qwen: { sup: { m: 13.899957, sd: 0.055691 }, risk: { m: 0.036496, sd: 0.000968 } },
          gemma: { sup: { m: 13.073379, sd: 0.053641 }, risk: { m: 0.079535, sd: 0.001441 } } },
        { surface: "Naive", cbu: 10.95, per100: 16.66,
          qwen: { sup: { m: 10.56388, sd: 0.043591 }, risk: { m: 0.026114, sd: 0.000818 } },
          gemma: { sup: { m: 10.072109, sd: 0.04205 }, risk: { m: 0.057302, sd: 0.001241 } } }
      ]}
    ],
    captionerControlMeta: {
      captioner: "Qwen3.5-35B-A3B",
      cc12mImages: "4,494", datacompImages: "4,775",
      imagesPerSource: "≈4.5–4.8k",   // Table 6 caption: 4,494 CC12M, 4,775 DataComp
      // one-sentence reading, over both sources and both judges
      claimedGain: "+3.7 to +3.9",   // 15.21 - 11.32, 14.60 - 10.95
      supGain:     "+3.0 to +3.6",   // supported CBU per caption, Ours - Naive
      riskAbove:   "0.01 to 0.02",   // risk(Ours) - risk(Naive)
      // CC12M surface concentration (Table 7) and one frequent naive-surface prefix
      naiveLonger: "1.8×",
      meanLexOurs: "186.6", meanLexNaive: "328.1",
      // a frequent prefix of the naive surface outside the opener regex (Sec. 5.2)
      frequentPrefix: { text: "… richly detailed", count: "157/4,494" },
      contentMassOurs: "0.09", contentMassNaive: "0.33",
      contentMassReleased: "0.07–0.16"   // every released CC12M surface on the same images
    },

    /* Table 7: Surface concentration on the CC12M naive surface, on the
       CC12M images of Table 6. "Long-form refs." is the range over CC12M-LLaVA-NeXT and
       PixelProse on the same images. */
    surfaceControl: [
      { metric: "Mean lex",                         ours: "186.6", naive: "328.1", refs: "67.5–91.4" },
      { metric: "Lex overflow<sub>248</sub>",       ours: "6.9%",  naive: "91.2%", refs: "0.1–0.8%" },
      { metric: "Top-100 raw prefix mass ↓",       ours: "0.14",  naive: "0.60",  refs: "0.29–0.71" },
      { metric: "Top-100 content prefix mass ↓",   ours: "0.09",  naive: "0.33",  refs: "0.13–0.16" },
      { metric: "Distinct-3-gram rate ↑",          ours: "0.59",  naive: "0.57",  refs: "0.40–0.49" }
    ],

    /* Per-type reading (appendix per-type table): Ours has lower risk than the
       pooled references in every claim type under both judges. Qwen–Gemma
       exact answer agreement on the identical CC12M question set, from
       cc12m_judge_agreement.<type>.exact_rate in cbu_vqa_by_category_b64.json. */
    judgeAgreement: { overall: "92.4%", count: "85.1%", textRendering: "87.6%" },

    /* Table 9 and Section 5.4: Human evaluation of image support.
       (a) design-weighted nominal exact agreement on 43 resolved claims, as
           mean ± standard deviation over 10,000 image-cluster bootstrap
           resamples (result file human_cbu/judge_human_agreement_bootstrap.json).
       (b) unweighted distribution of all 217 primary image
           judgments; "other" is "not visual" or "prefer not to answer". */
    human: {
      annotators: "Seven", judgments: "217", claims: "137", repeated: "80", perCell: "five", cells: "16",
      resolved: "43", resamples: "10,000", oursN: "111",
      agreement: [
        // percent; { m: mean, sd: bootstrap standard deviation }
        { judge: "Qwen",  n: 43, overall: { m: 84.8, sd: 9.7 }, ours: { m: 87.9, sd: 10.9 }, refs: { m: 82.5, sd: 14.6 } },
        { judge: "Gemma", n: 43, overall: { m: 84.2, sd: 9.7 }, ours: { m: 89.0, sd: 10.8 }, refs: { m: 80.7, sd: 14.7 } }
      ],
      direct: [
        { surface: "Ours", ours: true, n: 111,
          yes: [87, "78.4%"], uncertain: [22, "19.8%"], no: [0, "0.0%"],  other: [2, "1.8%"] },
        { surface: "LLaVA-NeXT",  n: 47,
          yes: [33, "70.2%"], uncertain: [10, "21.3%"], no: [2, "4.3%"],  other: [2, "4.3%"] },
        { surface: "Short tag surface", dagger: true, n: 20,   // Qwen3-VL-8B captions
          yes: [14, "70.0%"], uncertain: [5, "25.0%"],  no: [1, "5.0%"],  other: [0, "0.0%"] },
        { surface: "PixelProse",  n: 39,
          yes: [23, "59.0%"], uncertain: [9, "23.1%"],  no: [6, "15.4%"], other: [1, "2.6%"] }
      ]
    },

    /* Table 2: source families and "Ours scale" (unique image identities
       within each public caption-only release; not deduplicated across
       families; the three LAION subsets can share images). Links are the
       Hugging Face dataset repositories cited for each family. */
    release: {
      collection: "https://huggingface.co/collections/BootsofLagrangian/recaptioned-image-text-6ab5bf978e69805c3e33d5ce",
      total: "≈490M",
      groups: [
        { label: "Photorealistic / web", rows: [
          { family: "DataComp",      original: "web image–text pairs",        scale: "≈325.5M",
            refs: ["Recap-DataComp"], repo: "datacomp-recap-qwen3p5-35b-a3b" },
          { family: "CC12M",         original: "web alt-text",                     scale: "≈11.5M",
            refs: ["CC12M-LLaVA-NeXT", "PixelProse", "short tag surface†"], repo: "cc12m-recap-qwen3p5-35b-a3b" },
          { family: "LAION-pop",     original: "web alt-text",                     scale: "≈0.4M",
            refs: ["LAION-pop-Llama"], repo: "laion-pop-recap-qwen3p5-35b-a3b" },
          { family: "PD12M",         original: "Florence-2 captions + metadata",   scale: "≈12.4M",
            refs: ["PD12M released"], repo: "pd12m-recap-qwen3p5-35b-a3b" },
          { family: "CommonCatalog", original: "BLIP-2 captions",                  scale: "≈14.6M",
            refs: [], repo: "commoncatalog-cc-by-recap-qwen3p5-35b-a3b" },
          { family: "LAION-Aesthetics", original: "web alt-text",                  scale: "≈23.7M",
            refs: [], repo: "laion-aesthetics-recap-qwen3p5-35b-a3b" },
          { family: "LAION-HighRes-Aesthetic", original: "web alt-text",           scale: "≈82.7M",
            refs: [], repo: "laion-highres-aesthetic-recap-qwen3p5-35b-a3b" },
          { family: "Megalith-CC0",  original: "Florence-2 captions",              scale: "≈8.1M",
            refs: [], repo: "megalith-cc0-recap-qwen3p5-35b-a3b" }
        ]},
        { label: "Anime / booru", rows: [
          { family: "Danbooru",      original: "booru tags + metadata",            scale: "≈11.3M",
            refs: ["Danbooru-Florence"], repo: "danbooru-recap-qwen3p5-35b-a3b" }
        ]}
      ]
    }
  };
})();
