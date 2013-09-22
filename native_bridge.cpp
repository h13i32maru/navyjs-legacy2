#include "native_bridge.h"

#include <QDebug>

NativeBridge::NativeBridge(QObject *parent) : QObject(parent)
{
}

void NativeBridge::setLayoutPath(const QString &layoutPath) {
    mLayoutPath = layoutPath;
}

QString NativeBridge::getLayoutPath() const {
    return mLayoutPath;
}

void NativeBridge::addLayer(const QVariantMap &layer, const int &totalCount) {
    QMap<QString, QString> map;
    map["id"] = layer["id"].toString();
    map["class"] = layer["class"].toString();
    map["width"] = QString::number(layer["width"].toInt());
    map["height"] = QString::number(layer["height"].toInt());
    map["x"] = QString::number(layer["x"].toInt());
    map["y"] = QString::number(layer["y"].toInt());

    mLayers.append(map);
    if (mLayers.length() == totalCount) {
        emit changedLayers(mLayers);
    }
}
