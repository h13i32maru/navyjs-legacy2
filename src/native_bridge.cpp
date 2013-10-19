#include "util/n_json.h"
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

void NativeBridge::setViewsFromJS(const QString &viewsJsonText) {
    NJson json(viewsJsonText);
    emit this->viewsFromJS(json);
}

void NativeBridge::setCurrentViewFromJS(const QString &viewJsonText) {
    NJson json(viewJsonText);
    emit this->currentViewFromJS(json);
}

void NativeBridge::setCurrentViewPosFromJS(const int &x, const int &y) {
    emit this->currentViewPosFromJS(x, y);
}
