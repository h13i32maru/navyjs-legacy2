#include "plugin/view_plugin.h"

#include <QCheckBox>
#include <QComboBox>
#include <QDir>
#include <QLabel>
#include <QLineEdit>
#include <QSpinBox>
#include <QStandardItemModel>
#include <QTableView>
#include <n_project.h>
#include <QLayout>
#include <QHeaderView>
#include <QPushButton>
#include <QDebug>

#include <extend/n_combo_box.h>
#include <extend/n_json_array_editor.h>
#include <extend/n_text_list_selector.h>

#include <window/n_layout_json_table.h>

QWidget* ViewPlugin::createWidget(const NJson &widgetDefine, QObject *receiver, const char* slot, QWidget *originWidget) {
    NJson dummy;
    return ViewPlugin::createWidget(widgetDefine, dummy, receiver, slot, originWidget);
}

QWidget* ViewPlugin::createWidget(const NJson &widgetDefine, NJson &viewJson, QObject *receiver, const char *slot, QWidget *originWidget) {
    QWidget *widget = NULL;
    const char *signal = NULL;

    QString type = widgetDefine.getStr("type");
    QString key = widgetDefine.getStr("key");

    if (type == "string") {
        QLineEdit *l = new QLineEdit();
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = l;
        signal = SIGNAL(textChanged(QString));

        if (originWidget != NULL) {
            l->setText( ((QLineEdit*)originWidget)->text() );
        }
    }

    if (type == "number") {
        QSpinBox *s = new QSpinBox();
        s->setMinimum(0);
        s->setMaximum(9999);
        viewJson.set(key, widgetDefine.getInt("value"));
        widget = s;
        signal = SIGNAL(valueChanged(int));

        if (originWidget != NULL) {
            s->setValue( ((QSpinBox*)originWidget)->value() );
        }
    }

    if (type == "boolean") {
        QCheckBox *c = new QCheckBox();
        viewJson.set(key, widgetDefine.getBool("value"));
        widget = c;
        signal = SIGNAL(toggled(bool));

        if (originWidget != NULL) {
            c->setChecked( ((QCheckBox*)originWidget)->isChecked() );
        }
    }

    if (type == "stringList") {
        QComboBox *c = new QComboBox();
        NJson strings = widgetDefine.getObject("value");
        viewJson.set(key, strings.getStr("0"));
        for (int k = 0; k < strings.length(); k++) {
            c->addItem(strings.getStr(QString::number(k)));
        }
        widget = c;
        signal = SIGNAL(currentTextChanged(QString));

        if (originWidget != NULL) {
            c->setCurrentText( ((QComboBox*)originWidget)->currentText() );
        }
    }

    if (type == "numberList") {
        QComboBox *c = new QComboBox();
        NJson strings = widgetDefine.getObject("value");
        viewJson.set(key, strings.getInt("0"));
        for (int k = 0; k < strings.length(); k++) {
            c->addItem(strings.getStr(QString::number(k)));
        }
        widget = c;
        signal = SIGNAL(currentTextChanged(QString));

        if (originWidget != NULL) {
            c->setCurrentText( ((QComboBox*)originWidget)->currentText() );
        }
    }

    if (type == "pageList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::PAGE);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));

        if (originWidget != NULL) {
            b->setText( ((NTextListSelector*)originWidget)->text() );
        }
    }

    if (type == "sceneList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::SCENE);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));

        if (originWidget != NULL) {
            b->setText( ((NTextListSelector*)originWidget)->text() );
        }
    }

    if (type == "imageList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::IMAGE);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));

        if (originWidget != NULL) {
            b->setText( ((NTextListSelector*)originWidget)->text() );
        }
    }

    if (type == "layoutList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::LAYOUT);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));

        if (originWidget != NULL) {
            b->setText( ((NTextListSelector*)originWidget)->text() );
        }
    }

    if (type == "linkList") {
        NTextListSelector *b = new NTextListSelector(NTextListSelector::LINK);
        viewJson.set(key, widgetDefine.getStr("value"));
        widget = b;
        signal = SIGNAL(textChanged(QString));

        if (originWidget != NULL) {
            b->setText( ((NTextListSelector*)originWidget)->text() );
        }
    }

    if (type == "array") {
        NJsonArrayEditor *e = new NJsonArrayEditor(widgetDefine);
        viewJson.set(key, widgetDefine.getObject("value"));
        widget = e;
        signal = SIGNAL(changedJsonArray());

        if (originWidget != NULL) {
            e->setJsonArray( ((NJsonArrayEditor*)originWidget)->getJsonArray() );
        }
    }

    // ----
    if (widget != NULL) {
        widget->setProperty("widgetDefine", QVariant(widgetDefine.stringify()));
        widget->setObjectName(type + ":" + key);

        if (widgetDefine.getBool("readOnly")) {
            widget->setEnabled(false);
        }
    }
    if (receiver != NULL && slot != NULL && widget != NULL && signal != NULL) {
        QObject::connect(widget, signal, receiver, slot);
    }
    return widget;
}

void ViewPlugin::syncWidgetToView(QWidget *widget, NJson &view, const QString &keyPrefix) {
    QString type = widget->objectName().split(":")[0];
    QString key = widget->objectName().split(":")[1];
    if (!keyPrefix.isEmpty()) {
        key = keyPrefix + "." + key;
    }

    if (type == "string") {
        QLineEdit *l = (QLineEdit*) widget;
        view.set(key, l->text());
    } else if (type == "number") {
        QSpinBox *s = (QSpinBox*) widget;
        view.set(key, s->value());
    } else if (type == "boolean") {
        QCheckBox *c = (QCheckBox*) widget;
        view.set(key, c->isChecked());
    } else if (type == "stringList") {
        QComboBox *c = (QComboBox*) widget;
        view.set(key, c->currentText());
    } else if (type == "numberList") {
        QComboBox *c = (QComboBox*) widget;
        view.set(key, c->currentText().toInt());
    } else if (type == "pageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "sceneList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "imageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "linkList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "layoutList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        view.set(key, b->text());
    } else if (type == "array") {
        NJsonArrayEditor *e = (NJsonArrayEditor *)widget;
        view.set(key, e->getJsonArray());
    }
}

void ViewPlugin::syncViewToWidget(const NJson &view, QWidget *widget, const QString &keyPrefix) {
    QString type = widget->objectName().split(":")[0];
    QString key = widget->objectName().split(":")[1];

    if (!keyPrefix.isEmpty()) {
        key = keyPrefix + "." + key;
    }

    if (type == "string") {
        QLineEdit *l = (QLineEdit*) widget;
        l->setText(view.getStr(key));
    } else if (type == "number") {
        QSpinBox *s = (QSpinBox*) widget;
        s->setValue(view.getInt(key));
    } else if (type == "boolean") {
        QCheckBox *c = (QCheckBox*) widget;
        c->setChecked(view.getBool(key));
    } else if (type == "stringList") {
        QComboBox *c = (QComboBox*) widget;
        c->setCurrentText(view.getStr(key));
    } else if (type == "numberList") {
        QComboBox *c = (QComboBox*) widget;
        c->setCurrentText(QString::number(view.getInt(key)));
    } else if (type == "pageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "sceneList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "imageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "linkList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "layoutList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        b->setText(view.getStr(key));
    } else if (type == "array") {
        NJsonArrayEditor *e = (NJsonArrayEditor *)widget;
        e->setJsonArray(view.getObject(key));
    }
}

QString ViewPlugin::widgetToString(QWidget *widget) {
    QString type = widget->objectName().split(":")[0];

    if (type == "string") {
        QLineEdit *l = (QLineEdit*) widget;
        return l->text();
    } else if (type == "number") {
        QSpinBox *s = (QSpinBox*) widget;
        return QString::number(s->value());
    } else if (type == "boolean") {
        QCheckBox *c = (QCheckBox*) widget;
        return c->isChecked() ? "true": "false";
    } else if (type == "stringList") {
        QComboBox *c = (QComboBox*) widget;
        return c->currentText();
    } else if (type == "numberList") {
        QComboBox *c = (QComboBox*) widget;
        return c->currentText();
    } else if (type == "pageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "sceneList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "imageList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "linkList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "layoutList") {
        NTextListSelector *b = (NTextListSelector*)widget;
        return b->text();
    } else if (type == "array") {
        // stringifyした値だと表示に不適切なので固定文字列とする(ちょっと微妙)
        return "...";
    } else {
        qCritical() << "type is unknown. " << type;
        return "";
    }
}

QWidget* ViewPlugin::copyWidget(QWidget *widget, QObject* receiver, const char *slot) {
    NJson widgetDefine;
    widgetDefine.parse(widget->property("widgetDefine").toString());
    QWidget *newWidget = ViewPlugin::createWidget(widgetDefine, receiver, slot, widget);
    return newWidget;
}

ViewPlugin::ViewPlugin(QObject *parent) : QObject(parent){
    mCurrentTableWidgetItem = NULL;
}

void ViewPlugin::load(const QString &pluginDirPath) {
    QDir pluginDir(pluginDirPath);
    pluginDir.setFilter(QDir::NoDotAndDotDot | QDir::Dirs);
    QStringList dirNames = pluginDir.entryList();

    for (int i = 0; i < dirNames.length(); i++) {
        QString manifestPath = pluginDirPath + "/" + dirNames[i] + "/manifest.json";
        NJson manifestJson;
        manifestJson.parseFromFilePath(manifestPath);
        if (manifestJson.getStr("type") != "view") {
            continue;
        }

        NJson scripts = manifestJson.getObject("scripts");
        for (int j = 0; j < scripts.length(); j++) {
            QString jsonName = scripts.getStr(QString::number(j));
            QString jsonPath = pluginDirPath + "/" + dirNames[i] + "/" + jsonName;
            NJson json;
            json.parseFromFilePath(jsonPath);
            mJsonList.append(json);
        }
    }
}

QList<NJson> ViewPlugin::getJsonList() const {
    return mJsonList;
}

void ViewPlugin::createTableView(QWidget *parentWidget, QMap<QString, NJson> *defaultMap, QObject *receiver, const char *slot){
    mReceiver = receiver;
    mSlot = slot;

    QTableWidget *tableWidget = new QTableWidget();
    tableWidget->setColumnCount(2);
    tableWidget->horizontalHeader()->setStretchLastSection(true);
    tableWidget->verticalHeader()->setHidden(true);
    tableWidget->horizontalHeader()->setHidden(true);
    parentWidget->layout()->addWidget(tableWidget);

    QList<NJson> jsonList = getJsonList();
    int row = 0;
    for (int i = 0; i < jsonList.length(); i++) {
        NJson json = jsonList[i];
        QString className = json.getStr("class");
        NJson widgetDefine = json.getObject("define");
        NJson viewJson;
        QList<QTableWidgetItem *> items;

        tableWidget->insertRow(row);
        QTableWidgetItem *separator = new QTableWidgetItem(className);
        separator->setBackgroundColor(QColor(200, 200, 200));
        tableWidget->setItem(row, 0, separator);
        tableWidget->setSpan(row, 0, 1, 2);
        items.append(separator);
        row++;

        for (int j = 0; j < widgetDefine.length(); j++, row++) {
            tableWidget->insertRow(row);
            QString index = QString::number(j);
            QString label = widgetDefine.getStr(index + ".label");
            QWidget *widget = ViewPlugin::createWidget(widgetDefine.getObject(index), viewJson, receiver, slot);
            QTableWidgetItem *propLabel = new QTableWidgetItem(label);
            QTableWidgetItem *item = new QTableWidgetItem("");

            tableWidget->setItem(row, 0, propLabel);
            tableWidget->setItem(row, 1, item);

            mItemToWidget[item] = widget;
            items.append(item);
        }

        mClassToItems[className] = items;
        defaultMap->insert(className, viewJson);
    }

    QObject::connect(tableWidget, SIGNAL(itemClicked(QTableWidgetItem*)), this, SLOT(showCellWidget(QTableWidgetItem*)));
    tableWidget->setEditTriggers(QTableWidget::NoEditTriggers);
    tableWidget->setAlternatingRowColors(true);
    tableWidget->setSelectionBehavior(QTableWidget::SelectRows);
    tableWidget->setSelectionMode(QTableWidget::SingleSelection);
    tableWidget->setMinimumHeight((tableWidget->rowCount() + 1) * tableWidget->rowHeight(0));
    tableWidget->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
    tableWidget->setVerticalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    tableWidget->setTabKeyNavigation(false);

    ((QHBoxLayout *)parentWidget->layout())->addStretch();

    hideAllTable();
}

void ViewPlugin::syncViewToWidget(const NJson &view, const QString &className) const {
    QList<QTableWidgetItem *> items = mClassToItems[className];

    foreach (QTableWidgetItem *item, items) {
        QWidget *widget = mItemToWidget[item];

        // separatorとしての行はNULLなのでcontinueする
        if (widget == NULL) {
            continue;
        }

        widget->blockSignals(true);
        ViewPlugin::syncViewToWidget(view, widget);
        widget->blockSignals(false);

        QString value = ViewPlugin::widgetToString(widget);
        item->setText(value);
    }
}

void ViewPlugin::syncWidgetToView(NJson &view, const QString &className) const {
    QList<QTableWidgetItem *> items = mClassToItems[className];

    foreach (QTableWidgetItem *item, items) {
        QWidget *widget = mItemToWidget[item];
        // separatorとしての行はNULLなのでcontinueする
        if (widget == NULL) {
            continue;
        }

        ViewPlugin::syncWidgetToView(widget, view);
    }
}

void ViewPlugin::showTable(const QString &className) {
    if (!mClassToItems.contains(className)) {
        return;
    }

    foreach (QTableWidgetItem *item, mClassToItems[className]) {
        QTableWidget *tableWidget = item->tableWidget();
        tableWidget->showRow(item->row());
    }
}

void ViewPlugin::hideTable(const QString &className) {
    if (!mClassToItems.contains(className)) {
        return;
    }

    foreach (QTableWidgetItem *item, mClassToItems[className]) {
        QTableWidget *tableWidget = item->tableWidget();
        tableWidget->hideRow(item->row());
    }
}

void ViewPlugin::hideAllTable() {
    foreach (const QString &className, mClassToItems.keys()) {
        hideTable(className);
    }
}

QStringList ViewPlugin::getClassNames() const{
    return mClassToItems.keys();
}

void ViewPlugin::showCellWidget(QTableWidgetItem *item) {
    hideCurrentCellWidget();

    // widgetが存在するカラムのitemの場合だけ処理をする
    if (item->column() != 1) {
        mCurrentTableWidgetItem = NULL;
        return;
    }

    QTableWidget *tableWidget = item->tableWidget();
    QWidget *widget = mItemToWidget[item];
    widget->setAutoFillBackground(true);

    tableWidget->setCellWidget(item->row(), 1, widget);

    mCurrentTableWidgetItem = item;
}

void ViewPlugin::hideCurrentCellWidget() {
    if (mCurrentTableWidgetItem != NULL) {
        hideCellWidget(mCurrentTableWidgetItem);
    }
}

void ViewPlugin::hideCellWidget(QTableWidgetItem *item) {
    QTableWidget *tableWidget = item->tableWidget();
    QWidget *widget = mItemToWidget[item];

    QString value = ViewPlugin::widgetToString(widget);
    item->setText(value);

    // setIndexWidgetをすると以前のwidgetは破棄されてしまうのでcopyして新しいwidgetを作っておく
    QWidget *newWidget = copyWidget(widget, mReceiver, mSlot);
    mItemToWidget[item] = newWidget;
    tableWidget->setCellWidget(item->row(), 1, NULL);
}
