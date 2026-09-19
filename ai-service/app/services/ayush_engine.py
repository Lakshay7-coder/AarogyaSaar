from typing import Dict, Any, List
from app.schemas import AyushResponse

def evaluate_ayush_assessment(
    age: int,
    gender: str,
    chief_complaint: str,
    symptoms: List[str] = [],
    sleep_pattern: str = "Normal",
    diet_type: str = "Vegetarian",
    appetite: str = "Normal",
    bowel_habits: str = "Regular",
    stress_level: str = "Moderate",
    physical_activity: str = "Sedentary"
) -> AyushResponse:
    # Initialize base dosha score
    vata_score = 30
    pitta_score = 35
    kapha_score = 35

    all_terms = " ".join(symptoms + [chief_complaint, sleep_pattern, appetite, stress_level]).lower()

    # Vata triggers
    if any(w in all_terms for w in ["pain", "dry", "restless", "insomnia", "gas", "bloating", "constipation", "anxiety", "joint"]):
        vata_score += 25
    # Pitta triggers
    if any(w in all_terms for w in ["acid", "reflux", "fever", "burning", "hypertension", "diabetes", "sweating", "headache", "inflammation", "stress"]):
        pitta_score += 30
    # Kapha triggers
    if any(w in all_terms for w in ["cough", "cold", "mucus", "weight gain", "heaviness", "sluggish", "lethargy", "swelling"]):
        kapha_score += 25

    total = vata_score + pitta_score + kapha_score
    vata_pct = round((vata_score / total) * 100)
    pitta_pct = round((pitta_score / total) * 100)
    kapha_pct = 100 - vata_pct - pitta_pct

    # Determine dominant dosha
    scores = {"Vata": vata_pct, "Pitta": pitta_pct, "Kapha": kapha_pct}
    sorted_doshas = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    dominant_dosha = f"{sorted_doshas[0][0]}-{sorted_doshas[1][0]} (Dvandvaja)"

    # Determine Agni
    if "acid" in all_terms or "heartburn" in all_terms or pitta_pct > 40:
        agni = {
            "agniType": "Tikshnagni (Intense/Pitta)",
            "description": "Hyperactive metabolic and digestive state, leading to hyperacidity, thirst, and cellular inflammation."
        }
    elif "constipation" in all_terms or "gas" in all_terms or vata_pct > 40:
        agni = {
            "agniType": "Vishamagni (Irregular/Vata)",
            "description": "Erratic digestion with alternating high and poor appetite, flatulence, and dry bowels."
        }
    elif "heaviness" in all_terms or "sluggish" in all_terms or kapha_pct > 40:
        agni = {
            "agniType": "Mandagni (Sluggish/Kapha)",
            "description": "Slow, compromised metabolic transformation with tendency toward ama (endotoxin) accumulation."
        }
    else:
        agni = {
            "agniType": "Samagni (Balanced)",
            "description": "Optimum metabolic harmony and tissue transformation."
        }

    # Determine Vikriti (Imbalance)
    vikriti = {
        "currentImbalance": f"{sorted_doshas[0][0]} Vriddhi (aggravation) with secondary {sorted_doshas[1][0]} vitiation",
        "severity": "Moderate" if stress_level in ["Moderate", "High"] else "Mild"
    }

    # Dhatus affected
    dhatus = ["Rasa (Plasma/Lymphatics)"]
    if pitta_pct > 35:
        dhatus.append("Rakta (Blood Tissue)")
    if "diabetes" in all_terms or "weight" in all_terms:
        dhatus.append("Meda (Adipose/Metabolic Tissue)")
    if "pain" in all_terms or "joint" in all_terms:
        dhatus.append("Asthi (Bone/Skeletal Tissue)")

    # Herbal Recommendations with Classical References (Charaka/Sushruta)
    herbal_recs = []
    if "diabetes" in all_terms or "sugar" in all_terms:
        herbal_recs.append({
            "herb": "Amalaki & Haridra (Nisha-Amalaki)",
            "indication": "Prameha (metabolic dysregulation) & glycemic stability",
            "classicalRef": "Ashtanga Hridaya, Chikitsa Sthana"
        })
        herbal_recs.append({
            "herb": "Methi (Fenugreek Seed Extract)",
            "indication": "Enhances insulin sensitivity and regulates Agni",
            "classicalRef": "Bhavaprakasha Nighantu"
        })
    if "hypertension" in all_terms or "bp" in all_terms or "stress" in all_terms:
        herbal_recs.append({
            "herb": "Sarpagandha & Brahmi (Bacopa monnieri)",
            "indication": "Rakta-Capa-Shamana (BP regulation) & Manas calming",
            "classicalRef": "Charaka Samhita, Siddhi Sthana"
        })
    if "acid" in all_terms or "reflux" in all_terms or pitta_pct > 35:
        herbal_recs.append({
            "herb": "Yashtimadhu (Glycyrrhiza glabra) & Shatavari",
            "indication": "Mucosal protection, Pitta pacification, antacid support",
            "classicalRef": "Charaka Samhita, Sutra Sthana"
        })
    if not herbal_recs:
        herbal_recs.append({
            "herb": "Triphala Churna",
            "indication": "Digestive equilibrium, antioxidant and Rasayana support",
            "classicalRef": "Charaka Samhita, Rasayana Adhyaya"
        })

    # Dietary advice
    dietary_advice = [
        "Include Shashtika Shali (aged red rice), Yava (barley), and Moong dal in staple diet.",
        "Emphasize bitter (Tikta) and astringent (Kashaya) tastes to counter metabolic and pitta aggravation.",
        "Avoid deep-fried, sour (Amla), and excessively salty foods after 7:00 PM.",
        "Consume lukewarm water infused with coriander and cumin seeds throughout the day."
    ]

    # Lifestyle modifications
    lifestyle_mods = [
        "Dinacharya: Rise before sunrise (Brahmamuhurta) and engage in 30 min of gentle Pranayama (Anulom Vilom, Bhramari).",
        "Practice 15 minutes of Abhyanga (warm sesame or coconut oil self-massage) on weekends.",
        "Avoid daytime sleeping (Divaswapna), as it aggravates Kapha and Pitta in metabolic disorders.",
        "Establish fixed bedtime by 10:30 PM to optimize liver and Pitta circadian rhythm."
    ]

    # Contraindications
    contraindications = [
        "Do not consume milk and sour fruits/citrus simultaneously (Viruddha Ahara / incompatible food).",
        "Avoid vigorous exercise immediately following meals.",
        "Reduce consumption of heavy fermented foods (pickles, day-old batter, curd at night)."
    ]

    return AyushResponse(
        prakriti={
            "vata": vata_pct,
            "pitta": pitta_pct,
            "kapha": kapha_pct,
            "dominantDosha": dominant_dosha
        },
        vikriti=vikriti,
        agni=agni,
        dhatu=dhatus,
        herbalRecommendations=herbal_recs,
        dietaryAdvice=dietary_advice,
        lifestyleModifications=lifestyle_mods,
        contraindications=contraindications
    )
