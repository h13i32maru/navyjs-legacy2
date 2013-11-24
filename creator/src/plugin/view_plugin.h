#ifndef VIEW_PLUGIN_H
#define VIEW_PLUGIN_H

#include <QList>
#include <QTableView>
#include "util/n_json.h"

class ViewPlugin
{
public:
    static ViewPlugin* instance();

private:
    static ViewPlugin* mInstance;
    ViewPlugin();
    QList<NJson> mJsonList;

public:
    void load(const QString &pluginDirPath);
    void createTableView(QWidget *parentWidget, QMap<QString, QTableView*> *propMap, QObject *receiver, const char *slot) const;
    void syncViewToWidget(const NJson &view, QTableView *viewTable, QTableView *extraTable) const;
    void syncViewToWidget(const NJson &view, QTableView *Table) const;
    void syncWidgetToView(NJson &view, QTableView *table, QTableView *extraTable) const;
    void syncWidgetToView(NJson &view, QTableView *table) const;
    QList<NJson> getJsonList() const;
};

#endif // VIEW_PLUGIN_H
