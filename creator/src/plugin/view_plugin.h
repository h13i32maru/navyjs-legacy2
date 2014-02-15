#ifndef VIEW_PLUGIN_H
#define VIEW_PLUGIN_H

#include <QList>
#include <QMap>
#include <QTableView>
#include "util/n_json.h"

class ViewPlugin
{
public:
    static ViewPlugin* instance();
    static QWidget* createWidget(const NJson &widgetDefine, QObject *receiver = NULL, const char* slot = NULL);
    static QWidget* createWidget(const NJson &widgetDefine, NJson &viewJson, QObject *receiver = NULL, const char* slot = NULL);
    static QString encodeValue(QWidget *widget);
    static QString encodeValue(const NJson &jsonArray, const QString &type, const QString &key);
    static void decodeValue(QWidget *widget, const QString &value);
    static void decodeValue(NJson &jsonArray, const QString &value, const QString &type, const QString &key);

private:
    static ViewPlugin* mInstance;
    ViewPlugin();
    QList<NJson> mJsonList;

public:
    void load(const QString &pluginDirPath);
    void createTableView(QWidget *parentWidget, QMap<QString, QTableView*> *propMap, QMap<QString, NJson> *defaultMap, QObject *receiver, const char *slot) const;
    void syncViewToWidget(const NJson &view, QTableView *viewTable, QTableView *extraTable) const;
    void syncViewToWidget(const NJson &view, QTableView *Table) const;
    void syncWidgetToView(NJson &view, QTableView *table, QTableView *extraTable) const;
    void syncWidgetToView(NJson &view, QTableView *table) const;
    QList<NJson> getJsonList() const;
};

#endif // VIEW_PLUGIN_H
