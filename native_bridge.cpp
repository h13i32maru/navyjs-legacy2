#include "native_bridge.h"

NativeBridge::NativeBridge(QObject *parent) : QObject(parent)
{
}

void NativeBridge::setLayoutPath(QString layoutPath) {
    mLayoutPath = layoutPath;
}

QString NativeBridge::getLayoutPath() {
    return mLayoutPath;
}
