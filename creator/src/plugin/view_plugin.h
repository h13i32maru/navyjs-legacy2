#ifndef VIEW_PLUGIN_H
#define VIEW_PLUGIN_H

#include <QList>
#include <QMap>
#include <QTableWidget>
#include "util/n_json.h"

class ViewPlugin
{
public:
    static ViewPlugin* instance();
    static QWidget* createWidget(const NJson &widgetDefine, QObject *receiver = NULL, const char* slot = NULL);
    static QWidget* createWidget(const NJson &widgetDefine, NJson &viewJson, QObject *receiver = NULL, const char* slot = NULL);
    static void syncWidgetToView(QWidget *widget, NJson &view, const QString &keyPrefix = QString(""));
    static void syncViewToWidget(const NJson &view, QWidget *widget, const QString &keyPrefix = QString(""));
    static QString widgetToString(QWidget *widget);
    static QWidget* copyWidget(QWidget *widget);

private:
    static ViewPlugin* mInstance;
    ViewPlugin();
    QList<NJson> mJsonList;

public:
    void load(const QString &pluginDirPath);
    void createTableView(QWidget *parentWidget, QMap<QString, QTableWidget*> *propMap, QMap<QString, NJson> *defaultMap, QObject *receiver, const char *slot) const;
    void syncViewToWidget(const NJson &view, QTableWidget *viewTable, QTableWidget *extraTable) const;
    void syncViewToWidget(const NJson &view, QTableWidget *Table) const;
    void syncWidgetToView(NJson &view, QTableWidget *table, QTableWidget *extraTable) const;
    void syncWidgetToView(NJson &view, QTableWidget *table) const;
    QList<NJson> getJsonList() const;
};

#endif // VIEW_PLUGIN_H
