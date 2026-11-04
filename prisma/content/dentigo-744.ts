/** Translated from the authorized browser review of Dentigo lesson 744 on 2026-11-04.
 * Two study pages followed by five questions. Clinical editorial review remains required.
 */
export const pulpLesson = {
  slug: "dentigo-744-pulpa",
  title: "Aufbau der Pulpa: vier Zonen und ihre Zellen",
  blocks: [
    {
      title: "Vier Zonen – von der Dentinwand zum Zentrum",
      paragraphs: [
        "Die Pulpa ist keine einheitliche Gewebemasse. Sie besitzt vier unterschiedliche Zonen, die von der Dentinwand zum Zentrum angeordnet sind:",
        "1. Odontoblastenschicht – liegt direkt am Prädentin und bildet Dentin.\n2. Zellarme Zone (Weil-Zone) – ein zellarmer Streifen, durch den der Raschkow-Nervenplexus und subodontoblastische Kapillaren verlaufen.\n3. Zellreiche Zone – das eigentliche Reservoir der Pulpa: Fibroblasten, mesenchymale Stammzellen und residente Immunzellen.\n4. Pulpakern – enthält die größeren Blutgefäße und Nerven.",
        "Ein oft übersehener Punkt: Die beiden mittleren Zonen sind in der Kronenpulpa deutlich ausgeprägt, in der Wurzelpulpa dagegen wesentlich weniger. Das bedeutet, dass die Abwehr- und Reparaturfähigkeit der Pulpa in der Krone größer ist als in der Wurzel.",
      ],
      caption:
        "Histologischer Schnitt durch die reife Pulpa. Von oben nach unten: Dentin, Prädentin, Odontoblastenschicht, zellarme Zone, zellreiche Zone und Pulpakern. Die hohe Kerndichte der zellreichen Zone ist deutlich sichtbar. Quelle: Cohen’s Pathways of the Pulp, 12. Auflage, Abb. 13.1.",
    },
    {
      title:
        "Odontoblasten: kein Ersatz durch Teilung, aber durch Differenzierung",
      paragraphs: [
        "Odontoblasten sind postmitotische Zellen: Sie teilen sich nicht. Ein abgestorbener Odontoblast ist dauerhaft verloren.",
        "Odontoblasten sind durch Gap Junctions verbunden. Diese koordinieren die Sekretion und ermöglichen eine gleichmäßige Prädentinbildung. Im apikalen Zellbereich regulieren Tight Junctions die Durchlässigkeit der Schicht. Die Kavitätenpräparation stört diese Verbindungen und erhöht die Dentinpermeabilität.",
        "Die Pulpa befindet sich jedoch nicht in einer Sackgasse: Mesenchymale Stammzellen der zellreichen Zone können zu odontoblastenähnlichen Zellen differenzieren und Reparaturdentin bilden. Es ist unregelmäßiger, tubulusärmer und schwächer als das ursprüngliche Dentin, bildet aber eine Barriere.",
      ],
      diagram: [
        "Dentin",
        "Prädentin",
        "Tight Junctions: regulieren die Durchlässigkeit; können durch Präparation geschädigt werden",
        "Gap Junctions: Signalübertragung und koordinierte Sekretion",
        "Odontoblastenschicht: postmitotisch, keine Zellteilung",
        "Zellarme Zone: Raschkow-Plexus",
        "Zellreiche Zone: Stammzellreservoir",
        "Mesenchymale Stammzelle → Differenzierung → odontoblastenähnliche Zelle",
        "Reparaturdentin: unregelmäßig und tubulusarm. Ersatz durch Differenzierung, nicht durch Teilung.",
      ],
      caption:
        "Odontoblastenschicht: Gap Junctions ermöglichen Kommunikation und koordinierte Sekretion; Tight Junctions regulieren die Durchlässigkeit. Verlorene Odontoblasten werden über Stammzelldifferenzierung ersetzt. Das Produkt ist Reparaturdentin. Quelle: Cohen’s Pathways of the Pulp, 12. Auflage, Kapitel 13.",
    },
  ],
  questions: [
    {
      kind: "SINGLE_CHOICE",
      prompt:
        "Ein Student schließt aus der Bezeichnung ‚zellfreie Zone‘, dass dieser Streifen biologisch unwichtig sei und ignoriert werden könne. Wo liegt der Denkfehler?",
      options: [
        "Der Name ist falsch: Dieser Streifen ist tatsächlich der zellreichste Teil der Kronenpulpa.",
        "Der Name beschreibt die geringe Zelldichte; die Zone enthält Nervenfasern und Kapillaren.",
        "Es liegt kein Fehler vor: Der Streifen ist ein leerer, funktionsloser Raum zwischen zwei Zellschichten.",
        "Dieser Streifen kommt nur in Milchzähnen vor und verschwindet in bleibenden Zähnen.",
      ],
      correct: 1,
      explanation:
        "Die sogenannte zellfreie oder zellarme Weil-Zone ist kein leerer Raum. Sie enthält Nervenfasern, Kapillaren und Zellfortsätze. Ihr Name beschreibt die relative Zelldichte.",
    },
    {
      kind: "SINGLE_CHOICE",
      prompt:
        "Welche Aussage zum Unterschied der zellreichen Zone in Kronen- und Wurzelpulpa trifft zu?",
      options: [
        "Die Wurzelpulpa besitzt keine Odontoblasten und bildet kein Tertiärdentin.",
        "Die Blutversorgung der Wurzelpulpa stammt aus dem Desmodont.",
        "Die zellreiche Zone ist in der Krone deutlich, in der Wurzel weniger ausgeprägt.",
        "Die Kronenpulpa wird teilweise durch Speichel ernährt.",
      ],
      correct: 2,
      explanation:
        "Die zellreiche Zone und die Abgrenzung der Schichten sind in der Kronenpulpa deutlicher. Dieser Unterschied allein belegt keine grundsätzlich bessere Reparaturfähigkeit einer Region. Auch Blutversorgung, Entzündung, Kontamination und die Gesundheit des verbleibenden Gewebes sind entscheidend.",
    },
    {
      kind: "TRUE_FALSE",
      prompt:
        "Geschädigte Odontoblasten werden durch Teilung benachbarter gesunder Odontoblasten ersetzt.",
      options: ["Richtig", "Falsch"],
      correct: 1,
      explanation:
        "Die Aussage ist falsch. Reife Odontoblasten teilen sich nicht. Unter geeigneten Bedingungen können Vorläuferzellen zu odontoblastenähnlichen Zellen differenzieren. Das ist etwas anderes als die Teilung benachbarter gesunder Odontoblasten.",
    },
    {
      kind: "SINGLE_CHOICE",
      prompt:
        "Welcher Zusammenhang zwischen einer Schädigung von Zellkontakten in der Odontoblastenschicht und ihrer möglichen Folge ist richtig?",
      options: [
        "Der Verlust von Gap Junctions verstärkt die direkte Kommunikation zwischen Zellen.",
        "Eine Störung der Tight Junctions setzt den Transport zwischen den Zellen zwangsläufig auf null.",
        "Eine Zunahme der Gap Junctions stoppt zwangsläufig die Dentinbildung.",
        "Eine Störung der Tight Junctions kann die Regulation des parazellulären Transports beeinträchtigen und den Stoffdurchtritt erhöhen.",
      ],
      correct: 3,
      explanation:
        "Tight Junctions tragen zur Regulation des Stofftransports zwischen den Zellen bei. Eine Schädigung kann diese Regulation stören. Diese Wirkung darf nicht mit sämtlichen Faktoren gleichgesetzt werden, die die Durchlässigkeit der Dentintubuli bestimmen.",
    },
    {
      kind: "LETTER_ORDER",
      prompt:
        "Die Zone mit höherer Zelldichte zwischen der zellarmen Weil-Zone und dem zentralen Pulpagewebe wird in der Kronenpulpa als ______ Zone bezeichnet.",
      options: ["ZELLREICHE"],
      correct: 0,
      explanation:
        "Die Lösung lautet ‚zellreiche‘. Diese Zone liegt zentral der zellarmen Zone und enthält Fibroblasten und undifferenzierte Zellen. Pulpastammzellen sind nicht ausschließlich dort zu finden; auch perivaskuläre Bereiche sind wichtig.",
    },
  ],
} as const;
