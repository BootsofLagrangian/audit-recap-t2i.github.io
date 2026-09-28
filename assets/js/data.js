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

   Uncertainty: any numeric cell may be written as { m: <mean>, sd: <std> }
   instead of a bare number. Tables then print "mean ± std" and the Table 5
   chart draws a ±std whisker; plain numbers print as they are. Example:
     qwen: { sup: { m: 13.84, sd: 0.08 }, risk: { m: 0.035, sd: 0.002 } }
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     PENDING REFRESH (isolated on purpose)
       (1) DataComp rows under the Gemma Judge
       (2) The naive-captioner control under the Gemma Judge
     These are being re-measured. The values below are the current manuscript
     values. When the new numbers land, edit only this block: every table and
     chart that shows them reads from here.
     After a refresh, re-check the stated ranges in `summary` below. The
     DataComp/Gemma cells are currently not an endpoint of any stated range
     (sup. gain +5.07, risk drop 0.133, w/o count+relation gain +4.33), but a
     new value outside a range would move that range.
     ------------------------------------------------------------------------ */
  var PENDING = {
    // Table 5 (cross-corpus headline), DataComp row, Gemma Judge columns.
    // The Ours pair is also Table 6 (captioner control), DataComp / Ours, Gemma.
    dataCompGemma: { refSup: 7.68, oursSup: 12.75, refRisk: 0.217, oursRisk: 0.084 },
    // Table 6 (captioner control), "Naive Qwen3.5-35B-A3B" rows, Gemma Judge.
    naiveGemma: {
      cc12m:    { sup: 11.90, risk: 0.033 },
      datacomp: { sup: 11.37, risk: 0.040 }
    }
  };

  window.PAGE_DATA = {
    PENDING: PENDING,

    /* Lay summary shown at the top of the page under "In plain words".
       One string: paragraphs are separated by a blank line (\n\n) and each
       opens with one emoji. Replace the whole string to change the text. */
    laySummary:
      "🖼️ AI image generators learn by looking at millions of pictures, each with a short description. Today most of those descriptions are written by another AI, not by people.\n\n" +
      "🤔 But are those AI-written descriptions any good? Until now, finding out meant training a whole image generator, like baking an entire cake just to check whether the flour is fresh.\n\n" +
      "🔍 We built a simple check-up instead. Part of it is as easy as a teacher flipping through a stack of essays and noticing that they all begin with the same sentence: we count how often descriptions repeat themselves. Then we read the first 64 words of each description and ask: does it sound like what people actually type when they ask for an image? How many concrete things does it say about the picture, and is each one really there? Two different AI judges answer that last question, and we compared them with human raters.\n\n" +
      "✅ Our descriptions say more true things about each picture, and fewer wrong things, than existing long descriptions of the same pictures.\n\n" +
      "🎁 We are sharing descriptions for about 490 million images, plus the check-up tool, so anyone can test their own.",

    /* Stated ranges and totals, quoted as written.
       Abstract; Section 1 (Introduction, paragraph 3 and contribution list);
       Section 5 intro; Section 5.1; Section 6; Appendix A; Appendix Table 16. */
    summary: {
      supGain:       { lo: "+3.40", hi: "+6.35" },   // Abstract, Sec. 1: supported CBU per caption, 4 pairs x 2 judges
      claimedGain:   { lo: "+2.91", hi: "+6.14" },   // Sec. 1: claimed CBU per caption
      riskDrop:      { lo: "−0.046", hi: "−0.159" }, // Sec. 1: unsupported risk
      supGainShort:  "+3.4 to +6.4",                 // Sec. 5.1
      riskDropShort: "0.05 to 0.16",                 // Sec. 5.1
      exclCountRelationGain: "+2.67 to +5.21",       // Sec. 5.1 / App. Table 16 (w/o count and relation claims)
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
    relatedColumns: ["Bias", "T2I", "Corpus", "Unit", "Image", "Budget", "Prompt"],
    relatedLegend: [
      ["Bias", "social bias or harmful content"],
      ["T2I", "images from T2I generators"],
      ["Corpus", "dataset-level reading"],
      ["Unit", "text scored per claim or object mention"],
      ["Image", "text verified against the image"],
      ["Budget", "fixed text window"],
      ["Prompt", "register of user prompts"]
    ],
    relatedWork: [
      { group: "Dataset and caption studies",      work: "REVISE",         target: "visual datasets",      marks: ["✓", "–", "✓", "–", "–", "–", "–"] },
      { group: "Dataset and caption studies",      work: "LAION's Den",    target: "image–alt-text pairs", marks: ["✓", "–", "✓", "–", "–", "–", "–"] },
      { group: "Dataset and caption studies",      work: "Hirota et al.",  target: "caption enrichment",   marks: ["✓", "–", "✓", "✓", "✓", "–", "–"] },
      { group: "Dataset and caption studies",      work: "Brack et al.",   target: "training captions",    marks: ["✓", "✓", "✓", "–", "–", "–", "–"] },
      { group: "Claim-level metrics", work: "TIFA / DSG",     target: "generated images",     marks: ["–", "✓", "–", "✓", "✓", "–", "–"] },
      { group: "Claim-level metrics", work: "FAITHSCORE",     target: "VLM answers",          marks: ["–", "–", "–", "✓", "✓", "–", "–"] },
      { group: "Claim-level metrics", work: "DCScore",        target: "detailed captions",    marks: ["–", "–", "–", "✓", "✓", "–", "–"] },
      { group: "Ours",                work: "Ours",           target: "recaptioned corpora",  marks: ["–", "–", "✓", "✓", "✓", "✓", "✓"], ours: true }
    ],

    /* Table 4: audit axes. Noun phrases only; `rows` names the protocol
       field that gives the row count (50k paired rows per slice for text
       statistics and prompt-pool support; ≈5k rows per surface for claim
       extraction and verification). Metric strings may carry <i>, <sub> and
       the math class "m". */
    axes: [
      { axis: "Text budget",           des: "coverage",     reads: '<span class="m"><i>D<sub>c</sub></i></span>',
        failure: "too little text",    metric: 'avg. lex, <span class="m"><i>B</i></span>-eligibility',          boundary: "length prerequisite",   rows: "captionOnlyShort" },
      { axis: "Prompt-pool support",   des: "coverage",     reads: '<span class="m"><i>D<sub>c</sub></i></span> vs. pools',
        failure: "missing prompt phrasing", metric: "prompt-mass support ↑, <i>n</i>-gram JSD ↓",               boundary: "pool-conditioned",      rows: "captionOnlyShort" },
      { axis: "Claimed density",       des: "coverage",     reads: '<span class="m"><i>D<sub>c</sub></i></span>',
        failure: "few claims",         metric: "CBU/cap ↑, CBU/100 lex",                                          boundary: "caption-only count",    rows: "vqaShort" },
      { axis: "Surface concentration", des: "health",       reads: '<span class="m"><i>D<sub>c</sub></i></span>',
        failure: "repeated form",      metric: "top-100 prefix mass ↓, distinct-3 ↑, rep-4 ↓",                   boundary: "surface artifact",      rows: "captionOnlyShort" },
      { axis: "Support and risk",      des: "faithfulness", reads: '<span class="m"><i>D<sub>cx</sub></i></span>',
        failure: "unsupported claims", metric: '<span class="m">𝔼[<i>s</i>]</span> ↑, <span class="m">𝔼[<i>u</i>]</span> ↓, <span class="m"><i>ρ</i></span> ↓', boundary: "judge-conditional proxy", rows: "vqaShort" }
    ],

    /* Table 5: Cross-corpus headline at B = 64 lexical units.
       Cells are Ref -> Ours. Risk is unsupported / claimed CBU. */
    crossCorpus: [
      { id: "datacomp", pair: "DataComp", ref: "Recap-DataComp",
        lex: [50.9, 175.5], cbu: [10.44, 14.45], poolWins: 6,
        qwen:  { sup: [8.50, 13.84], risk: [0.177, 0.035] },
        gemma: { sup: [PENDING.dataCompGemma.refSup, PENDING.dataCompGemma.oursSup],
                 risk: [PENDING.dataCompGemma.refRisk, PENDING.dataCompGemma.oursRisk] } },
      { id: "laionpop", pair: "LAION-pop", ref: "LAION-pop-Llama",
        lex: [180.3, 182.9], cbu: [11.91, 14.82], poolWins: 5,
        qwen:  { sup: [10.80, 14.22], risk: [0.077, 0.031] },
        gemma: { sup: [10.22, 13.62], risk: [0.113, 0.060] } },
      { id: "pd12m", pair: "PD12M", ref: "PD12M released",
        lex: [39.7, 189.1], cbu: [9.78, 15.02], poolWins: 7,
        qwen:  { sup: [8.61, 14.29], risk: [0.103, 0.034] },
        gemma: { sup: [8.23, 13.54], risk: [0.131, 0.066] } },
      { id: "danbooru", pair: "Danbooru", ref: "Danbooru-Florence",
        lex: [43.6, 164.5], cbu: [8.18, 14.33], poolWins: 7,
        qwen:  { sup: [6.38, 12.73], risk: [0.217, 0.058] },
        gemma: { sup: [6.15, 11.86], risk: [0.235, 0.094] } }
    ],

    /* Table 8: CC12M frontier at B = 64, four surfaces, both judges.
       All columns use the same 4,494 aligned images. The dagger marks the
       short tag-style surface, read against Eq. (1) rather than long-form
       density. Section 5.3 text: PixelProse at ~89 lex; Qwen3-VL at ~12 lex. */
    cc12m: {
      surfaces: [
        { name: "Ours", ours: true,  cbu: 15.21, per100: 23.16,
          qwen: { sup: 14.60, risk: 0.030 }, gemma: { sup: 13.82, risk: 0.066 } },
        { name: "CC12M-LLaVA-NeXT",  cbu: 10.78, per100: 21.77,
          qwen: { sup: 9.84,  risk: 0.069 }, gemma: { sup: 9.44,  risk: 0.097 } },
        { name: "PixelProse",        cbu: 12.57, per100: 20.44,
          qwen: { sup: 10.73, risk: 0.129 }, gemma: { sup: 10.20, risk: 0.161 } },
        // CC12M-Qwen3-VL-8B captions: shown by role ("Short tag surface") in tables;
        // the page names the model once, in the "Length is not density" passage.
        { name: "Short tag surface", dagger: true, cbu: 6.44, per100: 55.84,
          qwen: { sup: 6.31,  risk: 0.014 }, gemma: { sup: 6.19,  risk: 0.028 } }
      ],
      pixelProseLex: "≈89",
      qwen3vlLex:    "≈12",
      tagSurfaceModel: "Qwen3-VL-8B",
      // Sec. 5.3 "Length is not density": one 64-word window of Ours vs. a whole CC12M-Qwen3-VL caption
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

    /* Table 6: Captioner control, same captioner, different policy.
       CC12M Naive: 4,494 captions. DataComp Naive: 4,645 captions
       (130 text-CBU extraction failures excluded). Gemma cells of the Naive
       rows and of DataComp / Ours come from PENDING. */
    captionerControl: [
      { source: "CC12M", rows: [
        { surface: "Ours", ours: true, cbu: 15.21, per100: 23.16,
          qwen: { sup: 14.60, risk: 0.030 }, gemma: { sup: 13.82, risk: 0.066 } },
        { surface: "Naive Qwen3.5-35B-A3B", cbu: 11.43, per100: 17.45,
          qwen: { sup: 11.10, risk: 0.022 }, gemma: PENDING.naiveGemma.cc12m }
      ]},
      { source: "DataComp", rows: [
        { surface: "Ours", ours: true, cbu: 14.45, per100: 21.84,
          qwen: { sup: 13.84, risk: 0.035 },
          gemma: { sup: PENDING.dataCompGemma.oursSup, risk: PENDING.dataCompGemma.oursRisk } },
        { surface: "Naive Qwen3.5-35B-A3B", cbu: 10.84, per100: 16.53,
          qwen: { sup: 10.53, risk: 0.021 }, gemma: PENDING.naiveGemma.datacomp }
      ]}
    ],
    captionerControlMeta: {
      cc12mNaiveN: "4,494", datacompNaiveN: "4,645", datacompFailures: "130",
      naiveLonger: "1.7×",                 // Sec. 5.2
      prefixA: { text: "… richly detailed", count: "185/4,494" },   // Sec. 5.2
      prefixB: { text: "… beautifully composed", count: "109" },   // Sec. 5.2
      contentMassNaive: "0.37", contentMassRefs: "0.07–0.16"        // Sec. 5.2
    },

    /* Table 7: Surface concentration on the CC12M Naive surface
       (same 4,494-image subset). "CC12M refs." is the range over the three
       released CC12M surfaces on the same images. */
    surfaceControl: [
      { metric: "Mean lex",                       ours: "186.6", naive: "324.6", diff: "+138.0",   refs: "11.5–91.4" },
      { metric: "Lex overflow<sub>248</sub>",      ours: "6.9%",  naive: "89.5%", diff: "+82.6 pp", refs: "0.0–0.8%" },
      { metric: "Top-100 raw prefix mass ↓",  ours: "0.14",  naive: "0.65",  diff: "+0.51",    refs: "0.11–0.71" },
      { metric: "Top-100 content prefix mass ↓", ours: "0.09", naive: "0.37", diff: "+0.28",   refs: "0.07–0.16" },
      { metric: "Distinct-3-gram rate ↑",     ours: "0.59",  naive: "0.54",  diff: "−0.05", refs: "0.40–0.72" }
    ],

    /* Table 9 and Section 5.4: Human evaluation of image support.
       (a) design-weighted nominal exact agreement on 43 resolved claims, as
           mean ± standard deviation over 10,000 image-cluster bootstrap
           resamples (result file human_cbu/judge_human_agreement_bootstrap.json).
       (b) unweighted observed-sample distribution of all 217 primary image
           ratings; "other" is "not visual" or "prefer not to answer". */
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
            refs: ["CC12M-LLaVA-NeXT", "PixelProse"], repo: "cc12m-recap-qwen3p5-35b-a3b" },
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
