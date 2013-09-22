#include "n_json.h"
#include "native_bridge.h"

#include <QDebug>
#include <QJsonValue>

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
    NJson json;
    json.parse(viewsJsonText.toUtf8());
    QList< QMap<QString, QString> > views;
    for (int i = 0; i < json.length(); i++) {
        QString index = QString::number(i);
        QMap<QString, QString> map;
        map["id"] = json.getStr(index + ".id");
        map["class"] = json.getStr(index + ".class");
        map["width"] = QString::number(json.getInt(index + "size.width"));
        map["height"] = QString::number(json.getInt(index + "size.height"));
        map["x"] = QString::number(json.getInt(index + "pos.x"));
        map["y"] = QString::number(json.getInt(index + "pos.y"));
        views.append(map);
    }

    emit viewsFromJS(views);
}

/*
void NativeBridge::setJsonOfView(const QVariant &json) {
    emit this->changedJsonOfView(json);
}
*/

void NativeBridge::setCurrentViewFromJS(const QString &viewJsonText) {
    NJson json;
    json.parse(viewJsonText);
    emit this->currentViewFromJS(json);
}
