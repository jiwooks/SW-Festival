"""Package source, documentation and execution evidence; exclude local data and runtimes."""
from pathlib import Path
import zipfile

ROOT=Path(__file__).resolve().parents[1]
EXCLUDED_ROOT={'.git','.venv','data','models','runtime'}

def include(path):
    rel=path.relative_to(ROOT)
    return not (rel.parts[0] in EXCLUDED_ROOT or set(rel.parts)&{'__pycache__','.pytest_cache'}
                or rel.parts[:2]==('eval','runs') or path.name=='.env' or path.suffix in {'.pyc','.log','.db','.sqlite3'}
                or path.name.endswith(('.sqlite3-wal','.sqlite3-shm')))

if __name__=='__main__':
    target=ROOT.parent/'persona-studio.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(ROOT.rglob('*')):
            if path.is_file() and include(path):archive.write(path,Path(ROOT.name)/path.relative_to(ROOT))
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        assert not any('/.venv/' in n or n.endswith(('.sqlite3','.env')) for n in archive.namelist())
        print(f'{target}: {len(archive.namelist())} files, {target.stat().st_size} bytes')
