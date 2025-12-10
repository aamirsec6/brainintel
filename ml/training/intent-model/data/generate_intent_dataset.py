import csv
import random
from pathlib import Path
from faker import Faker

fake = Faker()
Faker.seed(42)
random.seed(42)

OUTPUT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = OUTPUT_DIR / "intent_dataset.csv"

INTENTS = {
    "purchase": [
        "I'd like to order the {product}",
        "Can you help me buy a {product} with express delivery?",
        "Send me a quote for {product}, I want to complete the purchase.",
        "Is {product} available for same-day delivery?",
    ],
    "inquiry": [
        "What are the specs of {product}?",
        "Can you tell me more about the warranty for {product}?",
        "I have a question about my last order {order_id}.",
        "How do I return a product if I change my mind?",
    ],
    "complaint": [
        "My recent order {order_id} arrived damaged.",
        "I was double-charged for {product}. Fix it?",
        "The delivery was delayed and I never received {product}.",
        "Your support is unresponsive—need escalation.",
    ],
    "support": [
        "I need help resetting my account password.",
        "Can you connect me with support for a billing issue?",
        "My loyalty points are missing. Who can I talk to?",
        "How do I update my shipping address for upcoming orders?",
    ],
    "feedback": [
        "Loved the new collection, especially the {product}.",
        "The checkout flow could be smoother; here are my thoughts.",
        "Appreciate the quick support. Keep improving the loyalty benefits!",
        "You should add more color options for {product}.",
    ],
    "other": [
        "Just saying hi and exploring what you offer.",
        "Send me interesting drops for men.",
        "Do you have a referral program?",
        "I want to know the store timings for New Delhi.",
    ],
}

CHANNEL_PREFIX = {
    "whatsapp": "[WhatsApp]",
    "email": "[Email]",
    "chat": "[In-App Chat]",
}

def pick_intent_message(intent: str) -> str:
    template = random.choice(INTENTS[intent])
    return template.format(
        product=fake.word().capitalize(),
        order_id=fake.bothify(text="ORD-####"),
        name=fake.first_name(),
    )

def build_message(channel: str, intent: str) -> str:
    prefix = CHANNEL_PREFIX.get(channel, "[Channel]").strip()
    message = pick_intent_message(intent)
    if channel == "email":
        return f"{prefix} Subject: {fake.catch_phrase()}\n{message}. Regards, {fake.first_name()}"
    if channel == "whatsapp":
        return f"{prefix} {message} 😊"
    return f"{prefix} {message}"

def generate_dataset(num_samples: int = 3000):
    channels = list(CHANNEL_PREFIX.keys())
    intents = list(INTENTS.keys())
    rows = []

    for _ in range(num_samples):
        intent = random.choice(intents)
        channel = random.choice(channels)
        text = build_message(channel, intent)
        rows.append({
            "text": text,
            "intent": intent,
            "channel": channel,
            "context": fake.sentence(nb_words=6),
        })

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=["text", "intent", "channel", "context"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Generated intent dataset: {OUTPUT_FILE} ({len(rows)} rows)")


if __name__ == "__main__":
    generate_dataset()

