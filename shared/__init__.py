"""Fiserv shared infrastructure for crypto prototype monorepo.

Re-exports key classes from the three sub-packages so prototypes
can import directly::

    from shared import FinxactClient, INDXSimulator, DemoMode

Or import from the specific sub-package::

    from finxact_client import FinxactClient, Account, Balance
    from indx_simulator import INDXSimulator, SettlementResult
    from demo_mode import DemoMode
"""

from __future__ import annotations

# Lazy imports to avoid hard failures if a sub-package's dependencies
# are not yet installed.  Each prototype only needs a subset.

def _lazy_import_finxact():  # noqa: ANN202
    from .finxact_client import (
        Account,
        Balance,
        FinxactClient,
        Position,
        SweepResult,
        TransferResult,
    )
    return {
        "FinxactClient": FinxactClient,
        "Account": Account,
        "Balance": Balance,
        "Position": Position,
        "SweepResult": SweepResult,
        "TransferResult": TransferResult,
    }


def _lazy_import_indx():  # noqa: ANN202
    from .indx_simulator import (
        FDICCoverage,
        INDXSimulator,
        SettlementResult,
        SettlementStatus,
    )
    return {
        "INDXSimulator": INDXSimulator,
        "SettlementResult": SettlementResult,
        "SettlementStatus": SettlementStatus,
        "FDICCoverage": FDICCoverage,
    }


def _lazy_import_demo():  # noqa: ANN202
    from .demo_mode import DemoMode
    return {"DemoMode": DemoMode}


_LAZY_LOADERS = {
    "FinxactClient": _lazy_import_finxact,
    "Account": _lazy_import_finxact,
    "Balance": _lazy_import_finxact,
    "Position": _lazy_import_finxact,
    "SweepResult": _lazy_import_finxact,
    "TransferResult": _lazy_import_finxact,
    "INDXSimulator": _lazy_import_indx,
    "SettlementResult": _lazy_import_indx,
    "SettlementStatus": _lazy_import_indx,
    "FDICCoverage": _lazy_import_indx,
    "DemoMode": _lazy_import_demo,
}

_CACHE: dict[str, object] = {}


def __getattr__(name: str) -> object:
    if name in _CACHE:
        return _CACHE[name]
    loader = _LAZY_LOADERS.get(name)
    if loader is None:
        raise AttributeError(f"module 'shared' has no attribute {name!r}")
    exports = loader()
    _CACHE.update(exports)
    return _CACHE[name]


__all__ = list(_LAZY_LOADERS.keys())
