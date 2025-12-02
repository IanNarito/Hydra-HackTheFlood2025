import sys
import time


def run_pipeline(stages=None):
    # Default: run everything in order
    if stages is None:
        stages = ['scrape', 'validate', 'geocode', 'satellite', 'database']

    print("=" * 80)
    print("FLOOD CONTROL PROJECT DATA PIPELINE")
    print("=" * 80)
    print(f"Stages to run: {', '.join(stages)}")
    print("=" * 80)

    start_time = time.time()

    try:
        # Stage 1: Web Scraping
        if 'scrape' in stages:
            print("\n" + "=" * 80)
            print("STAGE 1: WEB SCRAPING")
            print("=" * 80)
            import flood_scraper
            flood_scraper.main()
            print("✓ Stage 1 complete")

        # Stage 2: Validation
        if 'validate' in stages:
            print("\n" + "=" * 80)
            print("STAGE 2: DATA VALIDATION")
            print("=" * 80)
            import flood_validator
            flood_validator.main()
            print("✓ Stage 2 complete")

        # Stage 3: Geocoding satellite candidates
        if 'geocode' in stages:
            print("\n" + "=" * 80)
            print("STAGE 3: GEOCODING SATELLITE CANDIDATES")
            print("=" * 80)
            import flood_geo_candidate
            flood_geo_candidate.main()
            print("✓ Stage 3 complete")

        # Stage 4: Sentinel Hub satellite URLs
        if 'satellite' in stages:
            print("\n" + "=" * 80)
            print("STAGE 4: SENTINEL HUB SATELLITE INTEGRATION")
            print("=" * 80)
            import flood_sentinel_hub
            flood_sentinel_hub.main()
            print("✓ Stage 4 complete")

        # Stage 5: Database Creation
        if 'database' in stages:
            print("\n" + "=" * 80)
            print("STAGE 5: DATABASE CREATION")
            print("=" * 80)
            import setup_database
            setup_database.main()
            print("✓ Stage 5 complete")

        elapsed_time = time.time() - start_time

        print("\n" + "=" * 80)
        print("PIPELINE COMPLETE!")
        print("=" * 80)
        print(f"Total execution time: {elapsed_time:.2f} seconds")
        print("\nOutput files:")
        if 'scrape' in stages:
            print("  - raw_projects.json                        (raw scraped data)")
        if 'validate' in stages:
            print("  - flood_control_projects.json              (cleaned data)")
            print("  - flagged_projects.json                    (flagged projects)")
            print(
                "  - satellite_verification_candidates.json   (high-risk, satellite-eligible subset)")
            print("  - validation_summary.json                  (stats for dashboard)")
            print(
                "  - coa_contractor_report.json              (COA-flagged contractor summary)")
        if 'geocode' in stages:
            print(
                "  - geocode_cache.json                       (cached geocoding results)")
            print(
                "  - satellite_candidates_geocoded.json       (candidates with lat/lon)")
        if 'satellite' in stages:
            print(
                "  - satellite_results.json                   (candidates with Sentinel image URLs)")
        if 'database' in stages:
            print("  - flood_control.db                         (SQLite database)")
        print("=" * 80)

    except KeyboardInterrupt:
        print("\n\nPipeline interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nPIPELINE FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    """Entry point with command-line argument support"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Flood Control Project Data Pipeline',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py
      # Run all stages: scrape, validate, geocode, satellite, database

  python main.py --stages scrape
      # Only scrape data

  python main.py --stages validate geocode satellite
      # Run validation + geocoding + Sentinel Hub URL generation

  python main.py --stages validate database
      # Run validation and database stages only
        """
    )

    parser.add_argument(
        '--stages',
        nargs='+',
        choices=['scrape', 'validate', 'geocode', 'satellite', 'database'],
        help='Specify which stages to run (default: all)'
    )

    args = parser.parse_args()

    run_pipeline(stages=args.stages)


if __name__ == "__main__":
    main()
