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

#include <extend/n_combo_box.h>
#include <extend/n_text_list_selector.h>

ViewPlugin* ViewPlugin::mInstance = NULL;

ViewPlugin* ViewPlugin::instance() {
    if (mInstance == NULL) {
        mInstance = new ViewPlugin();
    }

    return mInstance;
}

ViewPlugin::ViewPlugin() {
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

void ViewPlugin::createTableView(QWidget *parentWidget, QMap<QString, QTableView*> *propMap, QMap<QString, NJson> *defaultMap, QObject *receiver, const char *slot) const{
    int height = QLabel("AAA").sizeHint().height() * 1.5;

    QList<NJson> jsonList = getJsonList();
    for (int i = 0; i < jsonList.length(); i++) {
        NJson json = jsonList[i];
        NJson widgetDefine = json.getObject("define");

        QModelIndex modelIndex;
        QStandardItemModel *model = new QStandardItemModel(widgetDefine.length(), 2);
        model->setHorizontalHeaderItem(0, new QStandardItem("Property"));
        model->setHorizontalHeaderItem(1, new QStandardItem("Value"));

        QTableView *tableView = new QTableView();
        parentWidget->layout()->addWidget(tableView);
        tableView->setModel(model);
        tableView->horizontalHeader()->setStretchLastSection(true);
        tableView->verticalHeader()->setHidden(true);

        int row = 0;
        QString className = json.getStr("class");
        if (className == "Navy.View.View") {
            row = 2;

            // set id
            {
                model->setItem(0, 0, new QStandardItem("id"));
                modelIndex = model->index(0, 1);
                QLineEdit *l = new QLineEdit();
                l->setObjectName("string:id");
                tableView->setIndexWidget(modelIndex, l);
                tableView->setRowHeight(0, height);
                QObject::connect(l, SIGNAL(textChanged(QString)), receiver, slot);
            }

            // set class
            {
                model->setItem(1, 0, new QStandardItem("class"));
                modelIndex = model->index(1, 1);
                QLineEdit *l = new QLineEdit(className);
                l->setReadOnly(true);
                l->setObjectName("string:class");
                tableView->setIndexWidget(modelIndex, l);
                tableView->setRowHeight(1, height);
            }
        }

        NJson viewJson;

        for (int j = 0; j < widgetDefine.length(); j++, row++) {
            QString index = QString::number(j);
            QString label = widgetDefine.getStr(index + ".label");
            QString type = widgetDefine.getStr(index + ".type");
            QString key = widgetDefine.getStr(index + ".key");
            QWidget *widget = NULL;

            if (type == "string") {
                QLineEdit *l = new QLineEdit();
                viewJson.set(key, widgetDefine.getStr(index + ".value"));
                QObject::connect(l, SIGNAL(textChanged(QString)), receiver, slot);
                widget = l;
            } else if (type == "number") {
                QSpinBox *s = new QSpinBox();
                s->setMinimum(0);
                s->setMaximum(9999);
                viewJson.set(key, widgetDefine.getInt(index + ".value"));
                QObject::connect(s, SIGNAL(valueChanged(int)), receiver, slot);
                widget = s;
            } else if (type == "boolean") {
                QCheckBox *c = new QCheckBox();
                viewJson.set(key, widgetDefine.getBool(index + ".value"));
                QObject::connect(c, SIGNAL(toggled(bool)), receiver, slot);
                widget = c;
            } else if (type == "stringList") {
                QComboBox *c = new QComboBox();
                NJson strings = widgetDefine.getObject(index + ".value");
                viewJson.set(key, strings.getStr("0"));
                for (int k = 0; k < strings.length(); k++) {
                    c->addItem(strings.getStr(QString::number(k)));
                }
                QObject::connect(c, SIGNAL(currentTextChanged(QString)), receiver, slot);
                widget = c;
            } else if (type == "numberList") {
                QComboBox *c = new QComboBox();
                NJson strings = widgetDefine.getObject(index + ".value");
                viewJson.set(key, strings.getInt("0"));
                for (int k = 0; k < strings.length(); k++) {
                    c->addItem(strings.getStr(QString::number(k)));
                }
                QObject::connect(c, SIGNAL(currentTextChanged(QString)), receiver, slot);
                widget = c;
            } else if (type == "pageList") {
                NTextListSelector *b = new NTextListSelector(NTextListSelector::PAGE);
                viewJson.set(key, widgetDefine.getStr(index + ".value"));
                QObject::connect(b, SIGNAL(textChanged(QString)), receiver, slot);
                widget = b;
            } else if (type == "sceneList") {
                NTextListSelector *b = new NTextListSelector(NTextListSelector::SCENE);
                viewJson.set(key, widgetDefine.getStr(index + ".value"));
                QObject::connect(b, SIGNAL(textChanged(QString)), receiver, slot);
                widget = b;
            } else if (type == "imageList") {
                NTextListSelector *b = new NTextListSelector(NTextListSelector::IMAGE);
                viewJson.set(key, widgetDefine.getStr(index + ".value"));
                QObject::connect(b, SIGNAL(textChanged(QString)), receiver, slot);
                widget = b;
            } else if (type == "layoutList") {
                NTextListSelector *b = new NTextListSelector(NTextListSelector::LAYOUT);
                viewJson.set(key, widgetDefine.getStr(index + ".value"));
                QObject::connect(b, SIGNAL(textChanged(QString)), receiver, slot);
                widget = b;
            } else if (type == "linkList") {
                NTextListSelector *b = new NTextListSelector(NTextListSelector::LINK);
                viewJson.set(key, widgetDefine.getStr(index + ".value"));
                QObject::connect(b, SIGNAL(textChanged(QString)), receiver, slot);
                widget = b;
            }

            if (widget != NULL) {
                widget->setObjectName(type + ":" + key);
                model->setItem(row, 0, new QStandardItem(label));
                modelIndex = model->index(row, 1);
                tableView->setIndexWidget(modelIndex, widget);
                tableView->setRowHeight(row, height);
            }
        }

        tableView->setMinimumHeight((row + 1 ) * height);
        tableView->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
        tableView->setVerticalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
        tableView->hide();

        propMap->insert(className, tableView);
        defaultMap->insert(className, viewJson);
    }

    ((QHBoxLayout *)parentWidget->layout())->addStretch();
}

void ViewPlugin::syncViewToWidget(const NJson &view, QTableView *viewTable, QTableView *extraTable) const {
    this->syncViewToWidget(view, viewTable);
    this->syncViewToWidget(view, extraTable);
}

void ViewPlugin::syncViewToWidget(const NJson &view, QTableView *table) const {
    QAbstractItemModel *model = table->model();
    QModelIndex index;
    for (int row = 0; row < model->rowCount(); row++) {
        index = model->index(row, 1);
        QWidget *widget = table->indexWidget(index);
        QString type = widget->objectName().split(":")[0];
        QString key = widget->objectName().split(":")[1];

        widget->blockSignals(true);

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
        }

        widget->blockSignals(false);
    }
}

void ViewPlugin::syncWidgetToView(NJson &view, QTableView *table, QTableView *extraTable) const {
    this->syncWidgetToView(view, table);
    this->syncWidgetToView(view, extraTable);
}

void ViewPlugin::syncWidgetToView(NJson &view, QTableView *table) const {
    QAbstractItemModel *model = table->model();
    QModelIndex index;
    for (int row = 0; row < model->rowCount(); row++) {
        index = model->index(row, 1);
        QWidget *widget = table->indexWidget(index);
        QString type = widget->objectName().split(":")[0];
        QString key = widget->objectName().split(":")[1];

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
            view.set(key, c->currentText());
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
        }
    }
}
