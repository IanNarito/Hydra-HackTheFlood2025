import requests
import json

MEILISEARCH_HOST = "https://search.bettergov.ph"
API_KEY = "92fea9f087c3f51cc862b4ff19ea957fcfc93f7750a44bc9eb1e04d7cf0dc6e1"
INDEX_NAME = "bettergov_flood_control"
OUTPUT_FILE = "flood_control_raw_projects.json"


def fetch_all_projects():
    """Fetch all flood control projects from MeiliSearch API"""
    print("Starting data fetch from BetterGov MeiliSearch...")
    print("=" * 80)

    all_projects = []
    offset = 0
    batch_size = 1000

    url = f"{MEILISEARCH_HOST}/indexes/{INDEX_NAME}/search"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    while True:
        print(f"\nFetching batch at offset {offset}...")

        payload = {
            "q": "",
            "limit": batch_size,
            "offset": offset,
            "filter": 'type = "flood_control"'
        }

        try:
            response = requests.post(
                url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()

            data = response.json()
            hits = data.get("hits", [])
            estimated_total = data.get("estimatedTotalHits", 0)

            if not hits:
                print("No more data to fetch")
                break

            all_projects.extend(hits)
            print(f"Fetched {len(hits)} projects")
            print(f"Progress: {len(all_projects):,} / {estimated_total:,}")

            if len(all_projects) >= estimated_total:
                print("\nAll projects fetched!")
                break

            offset += batch_size

        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
            if all_projects:
                print(f"Returning {len(all_projects)} projects fetched so far")
                break
            else:
                raise

    print("\n" + "=" * 80)
    print(f"FETCH COMPLETE! Total: {len(all_projects):,} projects")
    print("=" * 80)

    return all_projects


def save_raw_data(projects, filename=OUTPUT_FILE):
    """Save raw scraped data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)
    print(f"\nRaw data saved to: {filename}")


def main():
    """Main scraping function"""
    try:
        # Fetch all projects
        projects = fetch_all_projects()

        if not projects:
            print("\nNo data fetched.")
            return

        # Save raw data
        save_raw_data(projects)

        print("\n" + "=" * 80)
        print("SCRAPING COMPLETE!")
        print("=" * 80)
        print(f"✓ {len(projects):,} projects scraped")
        print(f"✓ Raw data saved to: {OUTPUT_FILE}")
        print("=" * 80)

    except Exception as e:
        print(f"\nError during scraping: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
