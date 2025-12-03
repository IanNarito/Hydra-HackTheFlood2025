import sys
import time
import os
import subprocess

# ---------------------------------------------------------
# PIPELINE ORCHESTRATOR
# This script imports your specific files based on your screenshot
# ---------------------------------------------------------


def run_pipeline(stages=None):
    # Default: run everything in order
    if stages is None:
        stages = ['scrape', 'validate', 'geocode', 'satellite', 'database']

    print("=" * 80)
    print("🌊 FLOOD CONTROL PROJECT DATA PIPELINE")
    print("=" * 80)
    print(f"Stages to run: {', '.join(stages)}")
    print("=" * 80)

    start_time = time.time()

    try:
        # -----------------------------------------------------
        # STAGE 1: SCRAPING
        # File: flood_scraper.py
        # -----------------------------------------------------
        if 'scrape' in stages:
            print("\n" + "=" * 80)
            print("STAGE 1: WEB SCRAPING")
            print("=" * 80)
            result = subprocess.run([sys.executable, "flood_scraper.py"],
                                    capture_output=False)
            if result.returncode != 0:
                print("❌ Stage 1 Failed")
                sys.exit(1)
            print("✓ Stage 1 complete")

        # -----------------------------------------------------
        # STAGE 2: VALIDATION
        # File: flood_validator.py
        # -----------------------------------------------------
        if 'validate' in stages:
            print("\n" + "=" * 80)
            print("STAGE 2: DATA VALIDATION")
            print("=" * 80)
            result = subprocess.run([sys.executable, "flood_validator.py"],
                                    capture_output=False)
            if result.returncode != 0:
                print("❌ Stage 2 Failed")
                sys.exit(1)
            print("✓ Stage 2 complete")

        # -----------------------------------------------------
        # STAGE 3: GEOCODING
        # File: flood_geo_candidate.py
        # -----------------------------------------------------
        if 'geocode' in stages:
            print("\n" + "=" * 80)
            print("STAGE 3: GEOCODING SATELLITE CANDIDATES")
            print("=" * 80)

            # Check if the previous stage produced the input file
            if not os.path.exists("../Datas/satellite_verification_candidates.json"):
                print("⚠️  Warning: 'satellite_verification_candidates.json' missing.")
                print("   Did you run the 'validate' stage?")
                sys.exit(1)

            result = subprocess.run([sys.executable, "flood_geo_candidate.py"],
                                    capture_output=False)
            if result.returncode != 0:
                print("❌ Stage 3 Failed")
                sys.exit(1)
            print("✓ Stage 3 complete")

        # -----------------------------------------------------
        # STAGE 4: SATELLITE IMAGERY
        # File: flood_sentinel_hub.py
        # -----------------------------------------------------
        if 'satellite' in stages:
            print("\n" + "=" * 80)
            print("STAGE 4: SENTINEL HUB SATELLITE INTEGRATION")
            print("=" * 80)

            result = subprocess.run([sys.executable, "flood_sentinel_hub.py"],
                                    capture_output=False)
            if result.returncode != 0:
                print("❌ Stage 4 Failed")
                sys.exit(1)
            print("✓ Stage 4 complete")

        # -----------------------------------------------------
        # STAGE 5: DATABASE SETUP
        # File: setup_database.py
        # -----------------------------------------------------
        if 'database' in stages:
            print("\n" + "=" * 80)
            print("STAGE 5: DATABASE CREATION")
            print("=" * 80)
            result = subprocess.run([sys.executable, "setup_database.py"],
                                    capture_output=False)
            if result.returncode != 0:
                print("❌ Stage 5 Failed")
                sys.exit(1)
            print("✓ Stage 5 complete")

        elapsed_time = time.time() - start_time

        print("\n" + "=" * 80)
        print("✅ PIPELINE COMPLETE")
        print("=" * 80)
        print(f"Total execution time: {elapsed_time:.2f} seconds")
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
        formatter_class=argparse.RawDescriptionHelpFormatter
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
