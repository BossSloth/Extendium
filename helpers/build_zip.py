import os
import subprocess
import zipfile
from pathlib import Path, PurePosixPath

# Global configuration
INCLUDED = {
    '.millennium/Dist', 'backend', 'LICENSE',
    'README.md', 'plugin.json', 'requirements.txt', 'public', 'metadata.json', 'CHANGELOG.md'
}

def run_build():
    print("Running bun build...")
    # Change to project root directory
    root_dir = Path(__file__).parent.parent
    os.chdir(root_dir)

    # Windows needs shell=True
    use_shell = os.name == 'nt'

    try:
        process = subprocess.Popen(
            ['bun', 'run', 'build'],
            shell=use_shell,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            cwd=str(root_dir),
        )

        for line in process.stdout:
            print(line, end='')

        process.wait()

        if process.returncode != 0:
            print("Build failed")
            return False

        print("Build completed successfully")
        return True
    except Exception as e:
        print(f"Error running build: {e}")
        return False

def should_include_file(file_path: Path, root_dir: Path) -> bool:
    rel_path = PurePosixPath(file_path.relative_to(root_dir))  # Normalize path for consistent matching
    for pattern in INCLUDED:
        if rel_path.as_posix().startswith(pattern):  # Match patterns as prefixes for directories/files
            return True
    return False

def create_zip():
    # Get version from environment variable
    version = os.environ.get('RELEASE_VERSION', '')

    if not version:
        print("Error: RELEASE_VERSION environment variable is required")
        return False

    zip_name = f"Achievement-Groups-plugin-{version}.zip"

    # Root and output directories
    root_dir = Path(__file__).parent.parent
    build_dir = root_dir / 'build'
    build_dir.mkdir(parents=True, exist_ok=True)
    zip_path = build_dir / zip_name

    print(f"\nCreating zip file: {zip_path}")

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for included_path in INCLUDED:
            folder_path = root_dir / included_path

            # Check if the included path exists
            if not folder_path.exists():
                print(f"Warning: {folder_path} does not exist. Skipping.")
                continue

            # If it's a directory, include all its contents
            if folder_path.is_dir():
                for root, _, files in os.walk(folder_path):
                    for file in files:
                        file_path = Path(root) / file
                        rel_path = file_path.relative_to(root_dir)
                        zip_path_with_root = Path('Achievement-Groups-plugin') / rel_path
                        print(f"Adding: {zip_path_with_root}")
                        zipf.write(file_path, str(zip_path_with_root))
            # If it's a file, directly add it
            elif folder_path.is_file():
                rel_path = folder_path.relative_to(root_dir)
                zip_path_with_root = Path('Achievement-Groups-plugin') / rel_path
                if '.scss' in zip_path_with_root.as_posix():
                    print(f"Skipping: {zip_path_with_root}")
                    continue
                print(f"Adding file: {zip_path_with_root}")
                zipf.write(folder_path, str(zip_path_with_root))

    print("\nZip file created successfully!")
    return True

def main():
    if not run_build():
        exit(1)

    if not create_zip():
        exit(1)
    print("\nBuild and zip creation completed!")

if __name__ == "__main__":
    main()